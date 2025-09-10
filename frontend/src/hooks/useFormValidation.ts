import { useState } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  custom?: (value: any) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRules
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouchedState] = useState<Record<string, boolean>>({})

  const validateField = (name: string, value: any): string | null => {
    const rule = rules[name]
    if (!rule) return null

    // Required validation
    if (rule.required && (!value || value === '' || value === 0)) {
      return 'Este campo es obligatorio'
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Debe tener al menos ${rule.minLength} caracteres`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Debe tener máximo ${rule.maxLength} caracteres`
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Formato inválido'
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Debe ser mayor o igual a ${rule.min}`
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Debe ser menor o igual a ${rule.max}`
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }

  const validateAllFields = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Validate field on change if it was touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error || '' }))
    }
  }

  const setTouched = (name: string) => {
    setTouchedState(prev => ({ ...prev, [name]: true }))
    
    // Validate field when touched
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error || '' }))
  }

  const resetForm = (newValues?: Partial<T>) => {
    if (newValues) {
      setValues(prev => ({ ...prev, ...newValues }))
    } else {
      setValues(initialValues)
    }
    setErrors({})
    setTouchedState({})
  }

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAllFields,
    resetForm,
    isValid: Object.keys(errors).length === 0 || Object.values(errors).every(error => !error)
  }
}
