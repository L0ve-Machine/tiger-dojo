'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'select'
  placeholder?: string
  value: string | number
  onChange: (value: string | number) => void
  error?: string
  required?: boolean
  options?: { value: string; label: string }[]
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  options = [],
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (type === 'number') {
      const numValue = parseInt(e.target.value)
      onChange(isNaN(numValue) ? '' : numValue)
    } else {
      onChange(e.target.value)
    }
  }

  const inputType = type === 'password' && showPassword ? 'text' : type

  const baseInputClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-200
    bg-white text-slate-800 placeholder-slate-400
    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/50' 
      : 'border-slate-300 hover:border-slate-400'
    }
  `

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {type === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={handleInputChange}
            className={baseInputClasses}
            required={required}
          >
            <option value="">選択してください</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            className={baseInputClasses}
            required={required}
          />
        )}

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span className="w-4 h-4 text-red-500">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}