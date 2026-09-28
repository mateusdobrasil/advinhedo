'use client'

import { useTransition } from 'react'
import { alterarStatusAluno } from '../actions/usuarios'

interface BotaoProps {
  id: string
  nome: string
  statusAtual?: string | null
}

export default function BotaoStatusAluno({ id, nome, statusAtual }: BotaoProps) {
  const [isPending, startTransition] = useTransition()

  const isInativo = (statusAtual || 'Ativo').toLowerCase() === 'inativo'
  const novoStatus = isInativo ? 'Ativo' : 'Inativo'

  const handleClick = () => {
    const confirmacao = isInativo
      ? window.confirm(`Reativar o cadastro de ${nome}?\n\nAs matrículas antigas NÃO são restauradas automaticamente — se precisar, matricule novamente.`)
      : window.confirm(`Desativar o cadastro de ${nome}?\n\nIsso vai cancelar automaticamente qualquer matrícula ativa dessa pessoa em qualquer sala/turma (EBD, IBV e IBUC).`)

    if (!confirmacao) return

    startTransition(async () => {
      const resultado = await alterarStatusAluno(id, novoStatus)
      if (!resultado?.ok) {
        alert(resultado?.error || 'Ocorreu um erro ao tentar alterar o status do cadastro.')
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition border text-center disabled:opacity-50
        ${isInativo ? 'border-emerald-400/30 hover:bg-emerald-500/20' : 'border-red-400/30 hover:bg-red-500/20'}`}
    >
      {isPending ? 'Processando...' : (isInativo ? 'Reativar Aluno' : 'Desativar Aluno')}
    </button>
  )
}
