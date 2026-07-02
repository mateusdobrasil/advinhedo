/**
 * lib/reunioes-log.js
 * Log de ações do módulo Reuniões. Não há Supabase Auth aqui — a identidade
 * de quem está agindo vem do nome digitado no login (cookie `reunioes_user`,
 * ver app/aplicacao/actions/reunioes-auth.ts).
 */

export function nomeUsuarioReuniao() {
  if (typeof document === 'undefined') return 'Desconhecido'
  const m = document.cookie.match(/(?:^|; )reunioes_user=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : 'Desconhecido'
}

export async function registrarLogReuniao(supabase, { acao, tabela, registroId, detalhes }) {
  const { error } = await supabase.from('obreiro_log').insert({
    usuario_nome: nomeUsuarioReuniao(),
    acao,
    tabela_afetada: tabela ?? null,
    registro_id: registroId ?? null,
    detalhes: detalhes ?? null,
  })
  if (error) console.error('Falha ao gravar log em obreiro_log:', error.message)
}
