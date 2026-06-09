/**
 * hooks/useReuniaoAuth.ts  (versão 2 — sem sessionStorage)
 *
 * O middleware já bloqueia rotas não autenticadas no servidor.
 * Este hook agora só garante o redirecionamento no lado cliente
 * em caso de perda de sessão (cookie expirado durante navegação).
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verificarAuthReuniao } from '@/app/aplicacao/actions/reunioes-auth'

export function useReuniaoAuth() {
  const router = useRouter()

  useEffect(() => {
    verificarAuthReuniao().then(autenticado => {
      if (!autenticado) router.replace('/aplicacao/reunioes')
    })
  }, [router])
}