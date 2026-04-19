// ─── ÔNIBUS ────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Bus, Plus, Trash2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const formInicial = { placa: '', modelo: '', capacidade: 32, motorista_nome: '', motorista_telefone: '' }

export function Onibus() {
  const [onibus, setOnibus] = useState([])
  const [form, setForm] = useState(formInicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const carregar = async () => {
    const { data } = await api.get('/api/onibus')
    setOnibus(data)
  }

  useEffect(() => { carregar() }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setCarregando(true)
    try {
      await api.post('/api/onibus', { ...form, capacidade: Number(form.capacidade) })
      toast.success('Ônibus cadastrado!')
      setForm(formInicial)
      setModalAberto(false)
      carregar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao cadastrar.')
    } finally {
      setCarregando(false)
    }
  }

  const deletar = async (id, placa) => {
    if (!confirm(`Remover ônibus ${placa}?`)) return
    await api.delete(`/api/onibus/${id}`)
    toast.success('Ônibus removido!')
    carregar()
  }

  const statusCor = { ativo: 'bg-green-50 text-green-700', em_rota: 'bg-blue-50 text-blue-700', inativo: 'bg-gray-50 text-gray-500' }
  const statusLabel = { ativo: '✅ Disponível', em_rota: '🚌 Em rota', inativo: '⚫ Inativo' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ônibus</h1>
          <p className="text-slate-500 text-sm">{onibus.length} cadastrados</p>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {onibus.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Bus size={40} className="mx-auto mb-2 opacity-30" />
            Nenhum ônibus cadastrado
          </div>
        ) : onibus.map(o => (
          <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-blue-50 p-2 rounded-xl"><Bus size={20} className="text-blue-600" /></div>
              <button onClick={() => deletar(o.id, o.placa)}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
            <p className="font-bold text-slate-800 text-lg">{o.placa}</p>
            <p className="text-slate-500 text-sm">{o.modelo || 'Modelo não informado'}</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-slate-500">👤 {o.motorista || 'Motorista não informado'}</p>
              <p className="text-xs text-slate-500">👥 Capacidade: {o.capacidade} pessoas</p>
            </div>
            <div className="mt-3">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusCor[o.status]}`}>
                {statusLabel[o.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-slate-800 text-lg mb-4">Novo Ônibus</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { name: 'placa', label: 'Placa', placeholder: 'ABC-1234' },
                { name: 'modelo', label: 'Modelo', placeholder: 'Mercedes Benz OF-1721' },
                { name: 'motorista_nome', label: 'Nome do motorista', placeholder: 'Carlos Silva' },
                { name: 'motorista_telefone', label: 'Telefone do motorista', placeholder: '(92) 99999-9999' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="text-xs font-medium text-slate-600">{label}</label>
                  <input name={name} value={form[name]} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-600">Capacidade</label>
                <input type="number" name="capacidade" value={form.capacidade}
                  onChange={e => setForm({ ...form, capacidade: e.target.value })} min={1} max={60}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={carregando}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
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

export default Onibus
