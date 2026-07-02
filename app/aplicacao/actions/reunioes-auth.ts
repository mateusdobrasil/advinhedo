'use server'

/**
 * app/actions/reunioes-auth.ts
 * Server Action para validar a senha de acesso às reuniões.
 * A variável ADMIN_PASSWORD nunca chega ao browser.
 */

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const COOKIE_NAME      = 'reunioes_auth'
const COOKIE_NAME_USER = 'reunioes_user'
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
    path:     '/aplicacao/reunioes',
  })

  return { ok: true }
}

/**
 * Segunda etapa do login: registra o nome de quem está acessando.
 * O cookie NÃO é httpOnly de propósito — os componentes de Reuniões gravam
 * no Supabase direto do client e precisam ler esse nome para o log.
 */
export async function registrarNomeReuniao(nome: string): Promise<{ ok: boolean }> {
  const nomeLimpo = nome.trim()
  if (!nomeLimpo) return { ok: false }

  const cookieStore = await cookies()
  const autenticado = cookieStore.get(COOKIE_NAME)?.value === 'true'
  if (!autenticado) return { ok: false }

  // O Next.js já faz o percent-encoding do valor do cookie — não encodar aqui de novo
  cookieStore.set(COOKIE_NAME_USER, nomeLimpo, {
    httpOnly: false,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/aplicacao/reunioes',
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { error } = await supabase.from('obreiro_log').insert({
    usuario_nome: nomeLimpo,
    acao: 'login',
    tabela_afetada: null,
    detalhes: 'Acesso ao painel de Reuniões',
  })
  if (error) console.error('Falha ao gravar log de acesso em obreiro_log:', error.message)

  return { ok: true }
}

export async function logoutReuniao(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete(COOKIE_NAME_USER)
}

export async function verificarAuthReuniao(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value === 'true'
}