import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Bus, Map, TrendingUp, ArrowRight } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function StatCard({ icon: Icon, label, valor, cor, to }) {
  return (
    <Link to={to} className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow block`}>
      <div className={`inline-flex p-3 rounded-xl ${cor} mb-4`}>
        <Icon size={22} className="text-white" />
      </div>
      <p className="text-3xl font-bold text-slate-800">{valor}</p>
      <p className="text-slate-500 text-sm mt-1">{label}</p>
    </Link>
  )
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const [stats, setStats] = useState({ funcionarios: 0, onibus: 0, rotas: 0 })

  useEffect(() => {
  Promise.all([
    api.get('/api/funcionarios').catch(() => ({ data: [] })),
    api.get('/api/onibus').catch(() => ({ data: [] })),
    api.get('/api/rotas').catch(() => ({ data: [] })),
  ]).then(([f, o, r]) => {
    setStats({
      funcionarios: Array.isArray(f.data) ? f.data.length : 0,
      onibus: Array.isArray(o.data) ? o.data.length : 0,
      rotas: Array.isArray(r.data) ? r.data.length : 0
    })
  })
}, [])

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{saudacao}, {usuario?.nome?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 mt-1">Aqui está o resumo do seu sistema de transporte.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Funcionários cadastrados" valor={stats.funcionarios} cor="bg-blue-500" to="/funcionarios" />
        <StatCard icon={Bus} label="Ônibus cadastrados" valor={stats.onibus} cor="bg-emerald-500" to="/onibus" />
        <StatCard icon={Map} label="Rotas geradas" valor={stats.rotas} cor="bg-violet-500" to="/rotas" />
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-slate-700 mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/funcionarios" className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Adicionar Funcionário</span>
            </div>
            <ArrowRight size={16} className="text-blue-400" />
          </Link>
          <Link to="/onibus" className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <Bus size={18} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Cadastrar Ônibus</span>
            </div>
            <ArrowRight size={16} className="text-emerald-400" />
          </Link>
          <Link to="/rotas" className="flex items-center justify-between p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
            <div className="flex items-center gap-3">
              <Map size={18} className="text-violet-600" />
              <span className="text-sm font-medium text-violet-700">Gerar Rotas</span>
            </div>
            <ArrowRight size={16} className="text-violet-400" />
          </Link>
        </div>
      </div>

      {/* Link funcionário */}
      <div className="mt-4 bg-slate-800 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="font-semibold">Compartilhe com seus funcionários</p>
          <p className="text-slate-400 text-sm mt-1">Eles podem consultar a rota pelo celular sem precisar de login</p>
        </div>
        <Link to="/minha-rota" target="_blank"
          className="bg-white text-slate-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap">
          Ver página →
        </Link>
      </div>
    </div>
  )
}
