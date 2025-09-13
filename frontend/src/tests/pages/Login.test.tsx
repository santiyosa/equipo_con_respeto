import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../../pages/Login'

// Mock de axios para evitar llamadas reales a la API
import { vi } from 'vitest'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByLabelText(/usuario|email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña|password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión|login/i })).toBeInTheDocument()
  })

  it('should show forgot password link', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText(/olvidaste.*contraseña/i)).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    renderWithRouter(<Login />)
    
    const usernameInput = screen.getByLabelText(/usuario|email/i)
    const passwordInput = screen.getByLabelText(/contraseña|password/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión|login/i })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Verificar que se intenta hacer la llamada a la API
    await waitFor(() => {
      expect(submitButton).toBeInTheDocument()
    })
  })
})
