'use client'

import { useTransition } from 'react'
import { marcarComoPago } from '../actions/financeiro'

interface BotaoProps {
  cobrancaId: string
  modulo: 'ebd' | 'ibv' | 'ibuc'
}

export default function BotaoBaixarCobranca({ cobrancaId, modulo }: BotaoProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (window.confirm('Confirmar o recebimento desta cobrança?')) {
      startTransition(async () => {
        try {
          await marcarComoPago(cobrancaId, modulo)
        } catch (error) {
          alert('Ocorreu um erro ao tentar dar baixa na cobrança.')
        }
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-green-600 hover:text-green-800 text-sm font-bold bg-green-50 px-3 py-1 rounded-md transition ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isPending ? 'Processando...' : 'Baixar'}
    </button>
  )
}
