import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { ArrowLeft, Bus, Users } from 'lucide-react'

// Corrige ícones do Leaflet no Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const iconEmpresa = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const iconOnibus = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

function OnibusTracker({ onibusId, onAtualizar }) {
  const map = useMap()
  const wsRef = useRef(null)

  useEffect(() => {
    if (!onibusId) return
    wsRef.current = new WebSocket(`ws://localhost:8000/ws/onibus/${onibusId}`)
    wsRef.current.onmessage = (e) => {
      const dados = JSON.parse(e.data)
      onAtualizar(dados)
    }
    return () => wsRef.current?.close()
  }, [onibusId])

  return null
}

export default function MapaRota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rota, setRota] = useState(null)
  const [onibusPos, setOnibusPos] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get(`/api/rotas/${id}`)
      .then(({ data }) => {
        setRota(data)
        if (data.onibus?.lat_atual) {
          setOnibusPos({ lat: data.onibus.lat_atual, lon: data.onibus.lon_atual })
        }
      })
      .finally(() => setCarregando(false))
  }, [id])

  if (carregando) return <div className="flex items-center justify-center h-64">Carregando mapa...</div>
  if (!rota) return <div>Rota não encontrada.</div>

  const pontos = rota.pontos || []
  const coordenadas = pontos.map(p => [p.lat, p.lon])
  const centro = coordenadas[0] || [-3.1019, -60.0250] // Manaus

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/rotas')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{rota.nome}</h1>
          <p className="text-slate-500 text-sm">{rota.funcionarios?.length} funcionários · Turno {rota.turno}</p>
        </div>
      </div>

      {/* Info ônibus */}
      {rota.onibus && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Bus className="text-blue-600" size={20} />
          <div>
            <p className="font-medium text-blue-800">Ônibus {rota.onibus.placa}</p>
            <p className="text-blue-600 text-sm">Motorista: {rota.onibus.motorista || 'Não informado'}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${onibusPos ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {onibusPos ? '🟢 Online' : '⚪ Offline'}
          </span>
        </div>
      )}

      {/* Mapa */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '500px' }}>
        <MapContainer center={centro} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {/* Rota como linha */}
          {coordenadas.length > 1 && (
            <Polyline positions={coordenadas} color="#2563eb" weight={3} opacity={0.8} />
          )}

          {/* Pontos da rota */}
          {pontos.map((ponto, i) => (
            <Marker
              key={i}
              position={[ponto.lat, ponto.lon]}
              icon={ponto.tipo === 'empresa' ? iconEmpresa : L.Icon.Default.prototype}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{ponto.nome}</p>
                  {ponto.bairro && <p className="text-gray-500">{ponto.bairro}</p>}
                  <p className="text-gray-400">Parada {i}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Ônibus em tempo real */}
          {onibusPos && (
            <Marker position={[onibusPos.lat, onibusPos.lon]} icon={iconOnibus}>
              <Popup>🚌 Ônibus em tempo real</Popup>
            </Marker>
          )}

          {rota.onibus?.id && (
            <OnibusTracker onibusId={rota.onibus.id} onAtualizar={setOnibusPos} />
          )}
        </MapContainer>
      </div>

      {/* Lista de funcionários */}
      <div className="mt-6">
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Users size={16} /> Funcionários nesta rota
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rota.funcionarios?.map((f, i) => (
            <div key={f.id} className="bg-white border rounded-lg p-3 text-sm">
              <span className="text-gray-400 text-xs">#{i + 1}</span>
              <p className="font-medium text-slate-800">{f.nome}</p>
              <p className="text-slate-500">{f.bairro}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
