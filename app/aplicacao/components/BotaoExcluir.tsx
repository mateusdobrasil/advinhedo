'use client'

import { useTransition } from 'react'
import { excluirFatura, excluirDiario } from '../actions/excluir'

export default function BotaoExcluir({ id, modulo, tipo }: { id: string, modulo: 'ebd' | 'ibv' | 'ibuc', tipo: 'fatura' | 'diario' }) {
  const [isPending, startTransition] = useTransition()

  const handleExcluir = () => {
    // Alerta de confirmação para evitar cliques acidentais
    if (window.confirm(`Tem certeza que deseja excluir ${tipo === 'fatura' ? 'esta cobrança' : 'este lançamento'}? Esta ação não pode ser desfeita.`)) {
      startTransition(async () => {
        if (tipo === 'fatura') {
          await excluirFatura(id, modulo)
        } else {
          await excluirDiario(id, modulo)
        }
      })
    }
  }

  return (
    <button 
      onClick={handleExcluir}
      disabled={isPending}
      className="ml-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition disabled:opacity-50"
      title={tipo === 'fatura' ? 'Excluir cobrança' : 'Excluir lançamento'}
    >
      {isPending ? '⏳' : '🗑️'}
    </button>
  )
}