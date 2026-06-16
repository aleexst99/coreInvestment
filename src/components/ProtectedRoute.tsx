import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session)
    })
  }, [])

  // Todavía comprobando...
  if (isAuthenticated === null) return <p>Cargando...</p>

  // No autenticado → redirige al login
  if (!isAuthenticated) return <Navigate to="/" />

  // Autenticado → muestra la página
  return <>{children}</>
}
