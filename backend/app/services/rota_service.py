import json
import numpy as np
from sklearn.cluster import KMeans
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from sqlalchemy.orm import Session
from app.models import Funcionario, Rota, Onibus, TurnoEnum

geocoder = Nominatim(user_agent="rotafacil")

def geocodificar_endereco(endereco: str, cidade: str = "Manaus, AM, Brasil"):
    """Converte endereço em coordenadas geográficas."""
    try:
        local = geocoder.geocode(f"{endereco}, {cidade}")
        if local:
            return local.latitude, local.longitude
        return None, None
    except Exception:
        return None, None

def calcular_distancia(ponto1, ponto2):
    """Calcula distância em km entre dois pontos (lat, lon)."""
    return geodesic(ponto1, ponto2).kilometers

def agrupar_por_bairro_e_proximidade(funcionarios, capacidade: int = 32):
    """
    Agrupa funcionários primeiro por bairro, depois por proximidade.
    Respeita o limite de capacidade por grupo.
    """
    if not funcionarios:
        return []

    # Primeiro agrupa por bairro
    por_bairro = {}
    for f in funcionarios:
        bairro = f.bairro or "Outros"
        if bairro not in por_bairro:
            por_bairro[bairro] = []
        por_bairro[bairro].append(f)

    grupos_finais = []
    grupo_atual = []

    for bairro, funcs in por_bairro.items():
        for func in funcs:
            grupo_atual.append(func)
            if len(grupo_atual) >= capacidade:
                grupos_finais.append(grupo_atual)
                grupo_atual = []

    if grupo_atual:
        grupos_finais.append(grupo_atual)

    return grupos_finais

def otimizar_rota_grupo(empresa_coords, funcionarios):
    """
    Ordena os funcionários pela melhor sequência de coleta
    usando o algoritmo do vizinho mais próximo (nearest neighbor).
    """
    if not funcionarios:
        return []

    pontos = [(f.latitude, f.longitude) for f in funcionarios if f.latitude and f.longitude]
    if not pontos:
        return funcionarios

    visitados = []
    nao_visitados = list(range(len(pontos)))
    ponto_atual = empresa_coords

    while nao_visitados:
        mais_proximo = min(
            nao_visitados,
            key=lambda i: calcular_distancia(ponto_atual, pontos[i])
        )
        visitados.append(mais_proximo)
        ponto_atual = pontos[mais_proximo]
        nao_visitados.remove(mais_proximo)

    return [funcionarios[i] for i in visitados]

def gerar_rotas_empresa(db: Session, empresa_id: int, turno: TurnoEnum, capacidade: int = 32):
    """
    Função principal — gera todas as rotas de uma empresa para um turno.
    """
    from app.models import Empresa

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise ValueError("Empresa não encontrada.")

    empresa_coords = (empresa.latitude, empresa.longitude)

    # Busca funcionários do turno que têm coordenadas
    funcionarios = db.query(Funcionario).filter(
        Funcionario.empresa_id == empresa_id,
        Funcionario.turno == turno,
        Funcionario.ativo == True,
        Funcionario.latitude != None
    ).all()

    if not funcionarios:
        raise ValueError(f"Nenhum funcionário encontrado para o turno {turno}.")

    # Busca ônibus disponíveis
    onibus_disponiveis = db.query(Onibus).filter(
        Onibus.empresa_id == empresa_id,
        Onibus.ativo == True
    ).all()

    # Agrupa funcionários
    grupos = agrupar_por_bairro_e_proximidade(funcionarios, capacidade)

    # Remove rotas antigas do turno
    db.query(Rota).filter(
        Rota.empresa_id == empresa_id,
        Rota.turno == turno
    ).delete()

    rotas_criadas = []

    for idx, grupo in enumerate(grupos):
        # Otimiza a ordem de coleta
        grupo_otimizado = otimizar_rota_grupo(empresa_coords, grupo)

        # Monta lista de pontos para o mapa
        pontos = [{"lat": empresa.latitude, "lon": empresa.longitude, "nome": "Empresa", "tipo": "empresa"}]
        for f in grupo_otimizado:
            pontos.append({
                "lat": f.latitude,
                "lon": f.longitude,
                "nome": f.nome,
                "bairro": f.bairro,
                "tipo": "funcionario",
                "funcionario_id": f.id
            })

        # Associa ônibus se disponível
        onibus_id = onibus_disponiveis[idx].id if idx < len(onibus_disponiveis) else None

        # Cria a rota no banco
        bairros = list(set([f.bairro for f in grupo_otimizado]))
        nome_rota = f"Rota {idx + 1} — {', '.join(bairros[:2])}"

        rota = Rota(
            nome=nome_rota,
            turno=turno,
            empresa_id=empresa_id,
            onibus_id=onibus_id,
            pontos_json=json.dumps(pontos)
        )
        db.add(rota)
        db.flush()

        # Associa funcionários à rota
        for f in grupo_otimizado:
            f.rota_id = rota.id

        rotas_criadas.append({
            "rota_id": rota.id,
            "nome": nome_rota,
            "total_funcionarios": len(grupo_otimizado),
            "bairros": bairros,
            "onibus_placa": onibus_disponiveis[idx].placa if onibus_id else None
        })

    db.commit()
    return rotas_criadas
