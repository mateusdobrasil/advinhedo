'use server'

/**
 * app/actions/reunioes-auth.ts
 * Server Action para validar a senha de acesso às reuniões.
 * A variável ADMIN_PASSWORD nunca chega ao browser.
 */

import { cookies } from 'next/headers'

const COOKIE_NAME = 'reunioes_auth'
const MAX_AGE     = 60 * 60 * 8  // 8 horas

export async function loginReuniao(senha: string): Promise<{ ok: boolean }> {
  const senhaCorreta = process.env.ADMIN_PASSWORD  // sem NEXT_PUBLIC_ — fica só no servidor

  if (!senhaCorreta) {
    console.error('ADMIN_PASSWORD não definida nas variáveis de ambiente.')
    return { ok: false }
  }

  if (senha !== senhaCorreta) {
    return { ok: false }
  }

  // Seta cookie HttpOnly — o browser não consegue ler via JS
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, 'true', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/reunioes',
  })

  return { ok: true }
}

export async function logoutReuniao(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function verificarAuthReuniao(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value === 'true'
}