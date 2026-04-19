import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bus } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Registro() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState({
    nome: '', email: '', senha: '',
    empresa_nome: '', empresa_cnpj: '',
    empresa_endereco: '', empresa_telefone: '',
    empresa_latitude: -3.1019,
    empresa_longitude: -60.0250
  })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setCarregando(true)
    try {
      await api.post('/api/auth/registrar', form)
      toast.success('Empresa cadastrada! Faça login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao cadastrar.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Bus size={28} className="text-blue-600" />
            <span className="text-2xl font-bold text-slate-800">RotaFácil</span>
          </div>
          <p className="text-slate-500 text-sm">Cadastre sua empresa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dados do Gestor</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome completo</label>
              <input name="nome" value={form.nome} onChange={handleChange} required
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <input name="senha" type="password" value={form.senha} onChange={handleChange} required minLength={6}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Dados da Empresa</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome da empresa</label>
              <input name="empresa_nome" value={form.empresa_nome} onChange={handleChange} required
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">CNPJ</label>
              <input name="empresa_cnpj" value={form.empresa_cnpj} onChange={handleChange} required
                placeholder="00.000.000/0000-00"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Endereço da empresa</label>
            <input name="empresa_endereco" value={form.empresa_endereco} onChange={handleChange} required
              placeholder="Rua, número, bairro, cidade"
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Telefone</label>
              <input name="empresa_telefone" value={form.empresa_telefone} onChange={handleChange}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Latitude</label>
              <input name="empresa_latitude" type="number" step="any" value={form.empresa_latitude} onChange={handleChange} required
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Longitude</label>
              <input name="empresa_longitude" type="number" step="any" value={form.empresa_longitude} onChange={handleChange} required
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <p className="text-xs text-slate-400">💡 Para Manaus: latitude -3.1019, longitude -60.0250</p>

          <button type="submit" disabled={carregando}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
            {carregando ? 'Cadastrando...' : 'Cadastrar Empresa'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Já tem conta? <Link to="/login" className="text-blue-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
