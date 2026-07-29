'use client'

import { useTransition } from 'react'
import { excluirNivelAcesso } from '../actions/niveis-acesso'

export default function BotaoExcluirNivelAcesso({ id, nome }: { id: string, nome: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (window.confirm(`Remover o nível de acesso "${nome}"? Usuários que já têm esse cargo continuam com ele — só some da lista de opções para novas atribuições.`)) {
      startTransition(async () => {
        try {
          await excluirNivelAcesso(id, nome)
        } catch (error: any) {
          alert(error.message || 'Ocorreu um erro ao remover o nível de acesso.')
        }
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isPending ? 'Removendo...' : 'Remover'}
    </button>
  )
}
