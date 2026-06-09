'use client'

import { useTransition } from 'react'
import { alterarStatusMatricula } from '../actions/matriculas'

interface BotaoProps {
  matriculaId: string
  statusAtual: string
}

export default function BotaoStatusMatricula({ matriculaId, statusAtual }: BotaoProps) {
  const [isPending, startTransition] = useTransition()
  
  // Se já estiver trancada, o botão servirá para reativar
  const isTrancada = statusAtual?.toLowerCase() === 'trancada'
  const novoStatus = isTrancada ? 'Ativo' : 'Trancada'

  const handleClick = () => {
    const acaoText = isTrancada ? 'REATIVAR' : 'TRANCAR'
    
    // Confirmação para evitar acidentes
    if (window.confirm(`Tem certeza que deseja ${acaoText} esta matrícula?`)) {
      startTransition(async () => {
        try {
          await alterarStatusMatricula(matriculaId, novoStatus)
        } catch (error) {
          alert("Ocorreu um erro ao tentar alterar a matrícula.")
        }
      })
    }
  }

  return (
    <button 
      onClick={handleClick}
      disabled={isPending}
      className={`text-sm font-medium transition ${isPending ? 'opacity-50 cursor-not-allowed' : ''} 
        ${isTrancada ? 'text-green-600 hover:text-green-800' : 'text-red-500 hover:text-red-700'}`}
    >
      {isPending ? 'Processando...' : (isTrancada ? 'Reativar' : 'Trancar')}
    </button>
  )
}