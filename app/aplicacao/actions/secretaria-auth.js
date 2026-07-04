'use server'

/**
 * app/aplicacao/actions/secretaria-auth.js
 *
 * Autenticação da área da Secretaria.
 * - Senha conferida NO SERVIDOR contra a variável de ambiente
 *   SECRETARIA_SENHA (nunca vai para o bundle do cliente)
 * - Sessão gravada em cookie httpOnly de SESSÃO (sem maxAge):
 *   o navegador o descarta ao ser fechado → "pede senha de novo
 *   na próxima navegação", como solicitado
 *
 * REQUISITO no .env (e nas env vars da hospedagem):
 *   SECRETARIA_SENHA=uma-senha-forte-aqui
 *   SECRETARIA_COOKIE_SECRET=uma-string-aleatoria-longa   (opcional, ver abaixo)
 */

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NOME = 'secretaria_sessao'

// Assina o cookie para que o valor não possa ser forjado no cliente.
// Usa SECRETARIA_COOKIE_SECRET se existir; senão deriva da própria senha.
function segredoAssinatura() {
  return process.env.SECRETARIA_COOKIE_SECRET
    || process.env.SECRETARIA_SENHA
    || 'fallback-inseguro-defina-SECRETARIA_SENHA'
}

function assinar(valor) {
  return createHmac('sha256', segredoAssinatura()).update(valor).digest('hex')
}

// Token do cookie: "ok.<assinatura>" — validado sem guardar a senha
function gerarToken() {
  const base = 'ok'
  return `${base}.${assinar(base)}`
}

function tokenValido(token) {
  if (!token || !token.includes('.')) return false
  const [base, assinatura] = token.split('.')
  if (base !== 'ok' || !assinatura) return false
  const esperada = assinar(base)
  try {
    const a = Buffer.from(assinatura)
    const b = Buffer.from(esperada)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Confere a senha e cria a sessão. Retorna { ok } ou { ok: false, error }.
 */
export async function entrarSecretaria(senha) {
  const correta = process.env.SECRETARIA_SENHA

  if (!correta) {
    return { ok: false, error: 'Área não configurada. Defina SECRETARIA_SENHA no servidor.' }
  }

  // Comparação em tempo constante (evita ataques de timing)
  const a = Buffer.from(String(senha || ''))
  const b = Buffer.from(correta)
  const iguais = a.length === b.length && timingSafeEqual(a, b)

  if (!iguais) {
    return { ok: false, error: 'Senha incorreta.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NOME, gerarToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // SEM maxAge/expires → cookie de sessão: cai ao fechar o navegador
  })

  return { ok: true }
}

/**
 * Verifica se há sessão válida da Secretaria.
 * Usada pelo layout (server component) que protege o grupo de rotas.
 */
export async function verificarAuthSecretaria() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NOME)?.value
  return tokenValido(token)
}

/** Encerra a sessão da Secretaria */
export async function sairSecretaria() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NOME)
  return { ok: true }
}