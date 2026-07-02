'use server'

/**
 * app/aplicacao/actions/obreiro-editar.js
 *
 * Operações da página de edição de obreiro, executadas NO SERVIDOR —
 * mesmo padrão das demais: valida o cookie (verificarAuthReuniao) e
 * usa a service role key. O log de auditoria (registrarLogReuniao)
 * também passou para cá: gravação e log acontecem juntos no servidor.
 */

import { createClient } from '@supabase/supabase-js'
import { verificarAuthReuniao } from '@/app/aplicacao/actions/reunioes-auth'
import { registrarLogReuniao } from '@/lib/reunioes-log'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

const NAO_AUTENTICADO = { ok: false, error: 'Sessão expirada. Faça login novamente.' }

/**
 * Carrega o obreiro e as listas de apoio em uma chamada.
 * Retorna { ok, obreiro, congregacoes, cargos, funcoes } ou { ok: false, error }
 */
export async function carregarObreiroEdicao(id) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!id) return { ok: false, error: 'Obreiro não informado.' }

  const supabase = supabaseAdmin()

  const [obreiro, congs, cargos, funcoes] = await Promise.all([
    supabase.from('obreiro_cadastro').select('*').eq('id', id).single(),
    supabase.from('obreiro_congregacoes').select('id, nome').order('nome'),
    supabase.from('obreiro_cargos').select('id, nome, nivel').order('nivel', { ascending: false }),
    supabase.from('obreiro_funcoes').select('id, nome').order('nome'),
  ])

  if (obreiro.error) return { ok: false, error: 'Obreiro não encontrado.' }

  return {
    ok: true,
    obreiro: obreiro.data,
    congregacoes: congs.data ?? [],
    cargos: cargos.data ?? [],
    funcoes: funcoes.data ?? [],
  }
}

/**
 * Salva os dados do obreiro e registra o log de auditoria.
 * A ação (editar/inativar/reativar) é derivada NO SERVIDOR comparando
 * a situação atual do banco com a nova — mais confiável que confiar
 * no estado do navegador.
 * Retorna { ok: true } ou { ok: false, error }
 */
export async function salvarObreiro(id, payload) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!id) return { ok: false, error: 'Obreiro não informado.' }

  // Whitelist de campos: garante que só os campos do formulário
  // possam ser alterados por esta action (nunca face_descriptor,
  // foto_url ou qualquer outro campo sensível)
  const dados = {
    nome:            (payload.nome || '').trim(),
    congregacao_id:  payload.congregacao_id  || null,
    cargo_id:        payload.cargo_id        || null,
    funcao_id:       payload.funcao_id       || null,
    cpf:             payload.cpf             || null,
    data_nascimento: payload.data_nascimento || null,
    telefone:        payload.telefone        || null,
    email:           payload.email ? String(payload.email).toLowerCase() : null,
    situacao:        payload.situacao === 'Inativo' ? 'Inativo' : 'Ativo',
  }

  if (!dados.nome) return { ok: false, error: 'Nome é obrigatório.' }

  const supabase = supabaseAdmin()

  // Situação atual (para derivar a ação do log)
  const { data: atual, error: erroAtual } = await supabase
    .from('obreiro_cadastro')
    .select('situacao')
    .eq('id', id)
    .single()

  if (erroAtual) return { ok: false, error: 'Obreiro não encontrado.' }

  const { error } = await supabase
    .from('obreiro_cadastro')
    .update(dados)
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  let acao = 'editar'
  if (atual.situacao !== 'Inativo' && dados.situacao === 'Inativo') acao = 'inativar'
  else if (atual.situacao === 'Inativo' && dados.situacao !== 'Inativo') acao = 'reativar'

  // Log de auditoria no servidor (não bloqueia o sucesso se falhar)
  try {
    await registrarLogReuniao(supabase, {
      acao,
      tabela: 'obreiro_cadastro',
      registroId: id,
      detalhes: `Dados de "${dados.nome}" atualizados`,
    })
  } catch (e) {
    console.error('Falha ao registrar log de auditoria:', e?.message)
  }

  return { ok: true }
}