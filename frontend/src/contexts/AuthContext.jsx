import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
  const token = localStorage.getItem('token')
  const dados = localStorage.getItem('usuario')
  if (token && dados) {
    try {
      setUsuario(JSON.parse(dados))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    }
  }
  setCarregando(false)
}, [])

  const login = async (email, senha) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', senha)

    const { data } = await api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('usuario', JSON.stringify({
      nome: data.usuario_nome,
      empresa_id: data.empresa_id
    }))
    api.defaults.headers.Authorization = `Bearer ${data.access_token}`
    setUsuario({ nome: data.usuario_nome, empresa_id: data.empresa_id })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    delete api.defaults.headers.Authorization
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
