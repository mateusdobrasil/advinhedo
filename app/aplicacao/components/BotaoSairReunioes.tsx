'use client'

/**
 * components/BotaoSairReunioes.tsx
 * Botão de logout — chama Server Action e redireciona para /reunioes
 * Substitua o botão "Sair" atual no reunioes/admin/page.jsx por este componente.
 *
 * Uso: <BotaoSairReunioes />
 */

import { useRouter } from 'next/navigation'
import { logoutReuniao } from '@/app/aplicacao/actions/reunioes-auth'

export default function BotaoSairReunioes() {
  const router = useRouter()

  async function sair() {
    await logoutReuniao()
    router.push('/aplicacao/reunioes')
  }

  return (
    <button
      onClick={sair}
      style={{
        background: 'none',
        border: '1px solid #374151',
        color: '#9CA3AF',
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 13,
        cursor: 'pointer',
      }}>
      Sair
    </button>
  )
}