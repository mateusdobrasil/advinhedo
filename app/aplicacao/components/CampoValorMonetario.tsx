'use client'

import { useEffect, useState } from 'react'

interface CampoValorMonetarioProps {
  name?: string
  value?: number
  defaultValue?: number
  onValorChange?: (valor: number) => void
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  className?: string
}

// Input de valor monetário no padrão BR: exibe "1.234,56" enquanto o
// usuário digita (só dígitos, formatados como centavos) e alimenta um
// campo hidden com o valor numérico decimal ("1234.56") esperado pelas
// server actions.
export default function CampoValorMonetario({
  name,
  value,
  defaultValue = 0,
  onValorChange,
  disabled,
  readOnly,
  required,
  className = '',
}: CampoValorMonetarioProps) {
  const [centavos, setCentavos] = useState(() => Math.round((value ?? defaultValue ?? 0) * 100))

  useEffect(() => {
    if (value !== undefined) {
      setCentavos(Math.round(value * 100))
    }
  }, [value])

  const textoExibido = (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const valorReais = centavos / 100

  const lidarComMudanca = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '')
    const novosCentavos = digitos ? parseInt(digitos, 10) : 0
    setCentavos(novosCentavos)
    onValorChange?.(novosCentavos / 100)
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none select-none">
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={textoExibido}
        onChange={lidarComMudanca}
        disabled={disabled}
        readOnly={readOnly}
        className={`pl-9 ${className}`}
      />
      {name && <input type="hidden" name={name} value={valorReais.toFixed(2)} required={required} />}
    </div>
  )
}
