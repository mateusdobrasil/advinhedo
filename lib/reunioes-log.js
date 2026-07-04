/**
 * lib/reunioes-log.js
 * Log de ações do módulo Reuniões. Não há Supabase Auth aqui — a identidade
 * de quem está agindo vem do nome digitado no login (cookie `reunioes_user`,
 * ver app/aplicacao/actions/reunioes-auth.ts).
 *
 * IMPORTANTE: como as gravações agora acontecem em server actions, o nome
 * precisa ser lido do cookie NO SERVIDOR (cookies() do next/headers), não
 * de document.cookie (que só existe no navegador e retornava 'Desconhecido').
 */

// Lê o nome no NAVEGADOR (mantido para eventuais chamadas client-side)
function nomeUsuarioClient() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|; )reunioes_user=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : null
}

// Lê o nome no SERVIDOR, a partir do cookie de sessão
async function nomeUsuarioServer() {
  try {
    // import dinâmico: next/headers só existe no servidor
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    return cookieStore.get('reunioes_user')?.value || null
  } catch {
    return null
  }
}

/**
 * Descobre o responsável, funcionando tanto no servidor quanto no cliente.
 */
export async function nomeUsuarioReuniao() {
  // No servidor, document é undefined → usa o cookie via next/headers
  if (typeof document === 'undefined') {
    return (await nomeUsuarioServer()) || 'Desconhecido'
  }
  // No cliente, lê direto do document.cookie
  return nomeUsuarioClient() || 'Desconhecido'
}

export async function registrarLogReuniao(supabase, { acao, tabela, registroId, detalhes }) {
  const usuario_nome = await nomeUsuarioReuniao()

  const { error } = await supabase.from('obreiro_log').insert({
    usuario_nome,
    acao,
    tabela_afetada: tabela ?? null,
    registro_id: registroId ?? null,
    detalhes: detalhes ?? null,
  })
  if (error) console.error('Falha ao gravar log em obreiro_log:', error.message)
}