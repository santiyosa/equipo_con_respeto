import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'

export type UserRole = 'admin' | 'jugador'

interface User {
  id: number
  nombre: string
  email: string
  rol: UserRole
  cedula?: string // Para jugadores
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  isJugador: boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión guardada al cargar la aplicación
    const checkAuthStatus = () => {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        } catch (error) {
          localStorage.removeItem('user')
        }
      }
      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Llamada al endpoint unificado de login
      const response = await api.post('/api/auth/login', {
        email,
        password
      })

      if (response.data) {
        const userData: User = {
          id: response.data.tipo_usuario === 'jugador' ? response.data.cedula : response.data.id,
          nombre: response.data.nombre,
          email: response.data.email,
          rol: response.data.rol as UserRole,
          cedula: response.data.cedula || undefined
        }
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error en login:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  // Definir permisos basados en roles
  const permissions = {
    admin: [
      'dashboard.view',
      'pagos.view', 'pagos.create',
      'jugadores.view', 'jugadores.create',
      'multas.view', 'multas.create',
      'egresos.view', 'egresos.create',
      'configuraciones.view', 'configuraciones.create'
    ],
    jugador: [
      'dashboard.view',
      'pagos.view.own',
      'jugadores.view.own',
      'multas.view.own',
      'egresos.view'
    ]
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return permissions[user.rol]?.includes(permission) || false
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.rol === 'admin',
    isJugador: user?.rol === 'jugador',
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
