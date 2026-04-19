import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Search, Upload } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const turnos = [
  { value: '', label: 'Todos os turnos' },
  { value: 'manha', label: '🌅 Manhã' },
  { value: 'comercial', label: '☀️ Comercial' },
  { value: 'tarde', label: '🌇 Tarde' },
  { value: 'noite', label: '🌙 Noite' },
]

const formInicial = { nome: '', matricula: '', telefone: '', email: '', endereco: '', bairro: '', turno: 'comercial' }

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([])
  const [filtroTurno, setFiltroTurno] = useState('')
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState(formInicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const carregar = async () => {
    const params = filtroTurno ? { turno: filtroTurno } : {}
    const { data } = await api.get('/api/funcionarios', { params })
    setFuncionarios(data)
  }

  useEffect(() => { carregar() }, [filtroTurno])

  const handleSubmit = async e => {
    e.preventDefault()
    setCarregando(true)
    try {
      await api.post('/api/funcionarios', form)
      toast.success('Funcionário cadastrado!')
      setForm(formInicial)
      setModalAberto(false)
      carregar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao cadastrar.')
    } finally {
      setCarregando(false)
    }
  }

  const deletar = async (id, nome) => {
    if (!confirm(`Remover ${nome}?`)) return
    await api.delete(`/api/funcionarios/${id}`)
    toast.success('Funcionário removido!')
    carregar()
  }

  const filtrados = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.matricula.includes(busca) ||
    f.bairro.toLowerCase().includes(busca.toLowerCase())
  )

  const turnoLabel = { manha: '🌅 Manhã', comercial: '☀️ Comercial', tarde: '🌇 Tarde', noite: '🌙 Noite' }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Funcionários</h1>
          <p className="text-slate-500 text-sm">{funcionarios.length} cadastrados</p>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, matrícula ou bairro..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filtroTurno} onChange={e => setFiltroTurno(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {turnos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Nome', 'Matrícula', 'Bairro', 'Turno', 'Rota', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                Nenhum funcionário encontrado
              </td></tr>
            ) : filtrados.map(f => (
              <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{f.nome}</p>
                  <p className="text-slate-400 text-xs">{f.telefone}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{f.matricula}</td>
                <td className="px-4 py-3 text-slate-600">{f.bairro}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                    {turnoLabel[f.turno] || f.turno}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {f.rota_id
                    ? <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs">Designado</span>
                    : <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-xs">Sem rota</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => deletar(f.id, f.nome)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-slate-800 text-lg mb-4">Novo Funcionário</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'nome', label: 'Nome completo', placeholder: 'João Silva', colSpan: true },
                  { name: 'matricula', label: 'Matrícula', placeholder: '001234' },
                  { name: 'telefone', label: 'Telefone', placeholder: '(92) 99999-9999' },
                  { name: 'email', label: 'E-mail', placeholder: 'joao@email.com' },
                  { name: 'bairro', label: 'Bairro', placeholder: 'Flores' },
                  { name: 'endereco', label: 'Endereço', placeholder: 'Rua das Flores, 123', colSpan: true },
                ].map(({ name, label, placeholder, colSpan }) => (
                  <div key={name} className={colSpan ? 'col-span-2' : ''}>
                    <label className="text-xs font-medium text-slate-600">{label}</label>
                    <input name={name} value={form[name]} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Turno</label>
                <select name="turno" value={form.turno} onChange={e => setForm({ ...form, turno: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {turnos.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={carregando}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {carregando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
