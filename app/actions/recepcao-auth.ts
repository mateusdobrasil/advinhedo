'use server'

/**
 * app/actions/recepcao-auth.ts
 * Server Action para autenticação da recepção.
 */

import { cookies } from 'next/headers'

const COOKIE_NAME = 'recepcao_auth'
const MAX_AGE     = 60 * 60 * 8  // 8 horas

export async function loginRecepcao(senha: string): Promise<{ ok: boolean }> {
  const senhaCorreta = process.env.RECEPCAO_PASSWORD

  if (!senhaCorreta) {
    console.error('RECEPCAO_PASSWORD não definida nas variáveis de ambiente.')
    return { ok: false }
  }

  if (senha !== senhaCorreta) return { ok: false }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, 'true', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/recepcao',
  })

  return { ok: true }
}

export async function logoutRecepcao(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function verificarAuthRecepcao(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value === 'true'
}