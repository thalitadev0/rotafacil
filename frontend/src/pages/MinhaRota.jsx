import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { Bus, Search, MapPin, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function MinhaRota() {
  const [matricula, setMatricula] = useState('')
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const buscar = async () => {
    if (!matricula.trim()) return
    setCarregando(true)
    try {
      const { data } = await api.get(`/api/minha-rota/${matricula}`)
      setDados(data)
    } catch {
      toast.error('Matrícula não encontrada ou rota não gerada ainda.')
      setDados(null)
    } finally {
      setCarregando(false)
    }
  }

  const pontos = dados?.pontos || []
  const coordenadas = pontos.map(p => [p.lat, p.lon])
  const centro = coordenadas[0] || [-3.1019, -60.0250]

  const turnoLabel = {
    manha: '🌅 Manhã',
    comercial: '☀️ Comercial',
    tarde: '🌇 Tarde',
    noite: '🌙 Noite'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col">
      {/* Header */}
      <div className="p-6 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Bus size={28} />
          <span className="text-2xl font-bold">RotaFácil</span>
        </div>
        <p className="text-blue-200 text-sm">Consulte sua rota de transporte</p>
      </div>

      {/* Card principal */}
      <div className="flex-1 bg-gray-50 rounded-t-3xl p-6">
        {/* Busca */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-slate-700 mb-4">Digite sua matrícula</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={matricula}
              onChange={e => setMatricula(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="Ex: 001234"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={buscar}
              disabled={carregando}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {carregando ? '...' : <Search size={18} />}
            </button>
          </div>
        </div>

        {/* Resultado */}
        {dados && (
          <div className="space-y-4">
            {/* Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-3">Olá, {dados.funcionario}! 👋</h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={16} className="text-blue-500" />
                  <span>Turno: <strong>{turnoLabel[dados.turno] || dados.turno}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-blue-500" />
                  <span>Rota: <strong>{dados.rota_nome}</strong></span>
                </div>
                {dados.onibus && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Bus size={16} className="text-blue-500" />
                    <span>
                      Ônibus: <strong>{dados.onibus.placa}</strong>
                      {dados.onibus.motorista && ` · ${dados.onibus.motorista}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Status do ônibus */}
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium text-center ${
                dados.onibus?.lat_atual
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-500'
              }`}>
                {dados.onibus?.lat_atual
                  ? '🟢 Ônibus em rota — veja no mapa abaixo'
                  : '⚪ Ônibus ainda não iniciou a rota'}
              </div>
            </div>

            {/* Mapa */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-slate-700">Mapa da Rota</h3>
              </div>
              <div style={{ height: '350px' }}>
                <MapContainer center={centro} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© OpenStreetMap'
                  />
                  {coordenadas.length > 1 && (
                    <Polyline positions={coordenadas} color="#2563eb" weight={3} />
                  )}
                  {pontos.map((p, i) => (
                    <Marker key={i} position={[p.lat, p.lon]}>
                      <Popup><strong>{p.nome}</strong><br />{p.bairro}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
