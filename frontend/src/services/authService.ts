import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  nombre: string
  email: string
  rol: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await api.post('/api/admin/login', credentials, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      transformRequest: [(data: LoginCredentials) => {
        const params = new URLSearchParams()
        params.append('email', data.email)
        params.append('password', data.password)
        return params
      }]
    })
    
    return response.data
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      // En una implementación real, esto sería un endpoint protegido
      // Por ahora, solo devolvemos los datos del localStorage si existen
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        return JSON.parse(savedUser)
      }
      return null
    } catch (error) {
      return null
    }
  },

  logout(): void {
    localStorage.removeItem('user')
    // En una implementación real, aquí también invalidarías el token en el servidor
  }
}
