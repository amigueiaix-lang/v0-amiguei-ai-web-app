'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Check, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UsernameInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
}

export function UsernameInput({ value, onChange, disabled, required }: UsernameInputProps) {
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')

  // Validar formato do username
  const validateUsername = (username: string): string | null => {
    if (!username) return null

    if (username.length < 3) {
      return 'Mínimo 3 caracteres'
    }

    if (username.length > 30) {
      return 'Máximo 30 caracteres'
    }

    // Permitir apenas letras minúsculas, números, ponto e underscore
    if (!/^[a-z0-9._]+$/.test(username)) {
      return 'Use apenas letras minúsculas, números, . e _'
    }

    // Não permitir pontos ou underscores consecutivos
    if (/[._]{2,}/.test(username)) {
      return 'Não use .. ou __ consecutivos'
    }

    // Não começar ou terminar com ponto ou underscore
    if (/^[._]|[._]$/.test(username)) {
      return 'Não comece ou termine com . ou _'
    }

    return null
  }

  // Limpar e formatar username
  const formatUsername = (input: string): string => {
    return input
      .toLowerCase()
      // Remover acentos
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Remover espaços
      .replace(/\s+/g, '')
      // Manter apenas caracteres permitidos
      .replace(/[^a-z0-9._]/g, '')
      // Limitar a 30 caracteres
      .slice(0, 30)
  }

  // Verificar disponibilidade no banco
  const checkAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsAvailable(null)
      return
    }

    const validationError = validateUsername(username)
    if (validationError) {
      setIsAvailable(false)
      return
    }

    setChecking(true)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      if (error) {
        console.error('Erro ao verificar username:', error)
        setIsAvailable(null)
      } else {
        setIsAvailable(!data) // Disponível se não encontrou
      }
    } catch (err) {
      console.error('Erro ao verificar disponibilidade:', err)
      setIsAvailable(null)
    } finally {
      setChecking(false)
    }
  }

  // Debounce para verificar disponibilidade
  useEffect(() => {
    const validationError = validateUsername(value)
    setError(validationError || '')

    if (validationError) {
      setIsAvailable(false)
      return
    }

    if (!value || value.length < 3) {
      setIsAvailable(null)
      return
    }

    const timer = setTimeout(() => {
      checkAvailability(value)
    }, 500)

    return () => clearTimeout(timer)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUsername(e.target.value)
    onChange(formatted)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
          @
        </div>
        <Input
          type="text"
          placeholder="nomedeusuario"
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={`w-full border rounded-lg pl-9 pr-12 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4] ${
            error
              ? 'border-red-300 focus:border-red-400'
              : isAvailable
              ? 'border-green-300 focus:border-green-400'
              : 'border-gray-300'
          }`}
        />

        {/* Ícone de status */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {checking && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          {!checking && isAvailable && <Check className="w-5 h-5 text-green-500" />}
          {!checking && isAvailable === false && value.length >= 3 && (
            <X className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Mensagens de feedback */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && isAvailable === false && value.length >= 3 && (
        <p className="text-sm text-red-500">Esse username já está em uso</p>
      )}

      {!error && isAvailable === true && (
        <p className="text-sm text-green-600">Username disponível!</p>
      )}

      {!error && !value && (
        <p className="text-sm text-gray-500">
          Use apenas letras minúsculas, números, . e _ (sem espaços ou acentos)
        </p>
      )}
    </div>
  )
}
