import { describe, it, expect } from 'vitest'

// Funciones de utilidad para testing
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(amount)
}

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('es-CO')
}

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format numbers as Colombian currency', () => {
      expect(formatCurrency(1000)).toBe('$1.000,00')
      expect(formatCurrency(50000)).toBe('$50.000,00')
    })

    it('should handle zero values', () => {
      expect(formatCurrency(0)).toBe('$0,00')
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('-$1.000,00')
    })
  })

  describe('formatDate', () => {
    it('should format date strings', () => {
      const result = formatDate('2023-12-25')
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    it('should format Date objects', () => {
      const date = new Date(2023, 11, 25) // December 25, 2023
      const result = formatDate(date)
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })
})
