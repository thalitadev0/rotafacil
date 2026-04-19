import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Play, Eye, Users, Bus } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const turnos = [
  { value: 'manha', label: '🌅 Manhã' },
  { value: 'comercial', label: '☀️ Comercial' },
  { value: 'tarde', label: '🌇 Tarde' },
  { value: 'noite', label: '🌙 Noite' },
]

export default function Rotas() {
  const [rotas, setRotas] = useState([])
  const [turnoSelecionado, setTurnoSelecionado] = useState('comercial')
  const [filtroTurno, setFiltroTurno] = useState('')
  const [capacidade, setCapacidade] = useState(32)
  const [gerando, setGerando] = useState(false)
  const navigate = useNavigate()

  const carregar = async () => {
    const params = filtroTurno ? { turno: filtroTurno } : {}
    const { data } = await api.get('/api/rotas', { params })
    setRotas(data)
  }

  useEffect(() => { carregar() }, [filtroTurno])

  const gerarRotas = async () => {
    setGerando(true)
    try {
      const { data } = await api.post('/api/rotas/gerar', null, {
        params: { turno: turnoSelecionado, capacidade }
      })
      toast.success(data.mensagem)
      carregar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao gerar rotas.')
    } finally {
      setGerando(false)
    }
  }

  const turnoLabel = { manha: '🌅 Manhã', comercial: '☀️ Comercial', tarde: '🌇 Tarde', noite: '🌙 Noite' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rotas</h1>
          <p className="text-slate-500 text-sm">{rotas.length} rotas geradas</p>
        </div>
      </div>

      {/* Painel de geração */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <h2 className="font-semibold text-lg mb-1">Gerar Rotas Otimizadas</h2>
        <p className="text-blue-200 text-sm mb-4">
          O sistema agrupa funcionários por bairro e otimiza a ordem de coleta automaticamente.
        </p>
        <div className="flex gap-3 flex-wrap">
          <select value={turnoSelecionado} onChange={e => setTurnoSelecionado(e.target.value)}
            className="bg-white/20 border border-white/30 text-white rounded-xl px-4 py-2 text-sm focus:outline-none">
            {turnos.map(t => <option key={t.value} value={t.value} className="text-slate-800">{t.label}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-white/20 border border-white/30 rounded-xl px-4 py-2">
            <span className="text-sm">Capacidade:</span>
            <input type="number" value={capacidade} onChange={e => setCapacidade(Number(e.target.value))}
              min={1} max={60} className="w-16 bg-transparent text-white text-sm focus:outline-none" />
          </div>
          <button onClick={gerarRotas} disabled={gerando}
            className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 text-sm">
            <Play size={16} />
            {gerando ? 'Gerando...' : 'Gerar Rotas'}
          </button>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFiltroTurno('')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!filtroTurno ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'}`}>
          Todas
        </button>
        {turnos.map(t => (
          <button key={t.value} onClick={() => setFiltroTurno(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filtroTurno === t.value ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de rotas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rotas.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Map size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhuma rota gerada ainda.</p>
            <p className="text-sm mt-1">Use o painel acima para gerar as rotas.</p>
          </div>
        ) : rotas.map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium bg-blue-50 text-blue-700`}>
                {turnoLabel[r.turno]}
              </span>
              <button onClick={() => navigate(`/rotas/${r.id}/mapa`)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Eye size={14} /> Ver mapa
              </button>
            </div>

            <h3 className="font-bold text-slate-800 mb-3">{r.nome}</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={14} />
                <span>{r.total_funcionarios} funcionários</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Bus size={14} />
                <span>{r.onibus_placa || 'Ônibus não designado'}</span>
              </div>
            </div>

            <button onClick={() => navigate(`/rotas/${r.id}/mapa`)}
              className="w-full mt-4 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
              Abrir Mapa
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
