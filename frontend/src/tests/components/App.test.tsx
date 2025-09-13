import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../../App'

// Helper para renderizar con Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('App Component', () => {
  it('should render without crashing', () => {
    renderWithRouter(<App />)
    expect(document.body).toBeInTheDocument()
  })

  it('should display login page initially', () => {
    renderWithRouter(<App />)
    // Buscar elementos que deberían estar en la página de login
    expect(screen.getByText(/login/i) || screen.getByText(/iniciar sesión/i) || screen.getByRole('button')).toBeInTheDocument()
  })
})
