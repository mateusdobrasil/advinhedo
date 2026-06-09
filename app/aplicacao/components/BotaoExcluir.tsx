'use client'

import { useTransition } from 'react'
import { excluirNota, excluirFatura } from '../actions/excluir'

export default function BotaoExcluir({ id, alunoId, tipo }: { id: string, alunoId: string, tipo: 'nota' | 'fatura' }) {
  const [isPending, startTransition] = useTransition()

  const handleExcluir = () => {
    // Alerta de confirmação para evitar cliques acidentais
    if (window.confirm(`Tem certeza que deseja excluir esta ${tipo}? Esta ação não pode ser desfeita.`)) {
      startTransition(async () => {
        if (tipo === 'nota') {
          await excluirNota(id, alunoId)
        } else {
          await excluirFatura(id, alunoId)
        }
      })
    }
  }

  return (
    <button 
      onClick={handleExcluir}
      disabled={isPending}
      className="ml-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition disabled:opacity-50"
      title={`Excluir ${tipo}`}
    >
      {isPending ? '⏳' : '🗑️'}
    </button>
  )
}