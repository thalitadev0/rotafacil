import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Funcionarios from './pages/Funcionarios'
import Onibus from './pages/Onibus'
import Rotas from './pages/Rotas'
import MapaRota from './pages/MapaRota'
import MinhaRota from './pages/MinhaRota'
import Layout from './components/Layout'

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  return usuario ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/minha-rota" element={<MinhaRota />} />

          {/* Rotas protegidas — gestor */}
          <Route path="/" element={<RotaProtegida><Layout /></RotaProtegida>}>
            <Route index element={<Dashboard />} />
            <Route path="funcionarios" element={<Funcionarios />} />
            <Route path="onibus" element={<Onibus />} />
            <Route path="rotas" element={<Rotas />} />
            <Route path="rotas/:id/mapa" element={<MapaRota />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
