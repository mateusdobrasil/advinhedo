'use server'

/**
 * app/aplicacao/actions/configuracoes.js
 *
 * Gestão das listas auxiliares (congregações, cargos e funções),
 * no padrão das demais actions (cookie + service role).
 *
 * Segurança: o "tipo" é uma whitelist — a action só opera nas três
 * tabelas mapeadas abaixo, nunca em um nome de tabela vindo do cliente.
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

// Whitelist: tipo → tabela + coluna de referência em obreiro_cadastro
const TIPOS = {
  congregacao: { tabela: 'obreiro_congregacoes', fk: 'congregacao_id', rotulo: 'Congregação' },
  cargo:       { tabela: 'obreiro_cargos',       fk: 'cargo_id',       rotulo: 'Cargo' },
  funcao:      { tabela: 'obreiro_funcoes',      fk: 'funcao_id',      rotulo: 'Função' },
}

async function logSeguro(supabase, dados) {
  try { await registrarLogReuniao(supabase, dados) }
  catch (e) { console.error('Falha ao registrar log:', e?.message) }
}

/**
 * Carrega as três listas + contagem de uso de cada item
 * (quantos obreiros apontam para ele).
 */
export async function listarConfiguracoes() {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO

  const supabase = supabaseAdmin()

  const [congs, cargos, funcoes, obreiros] = await Promise.all([
    supabase.from('obreiro_congregacoes').select('id, nome').order('nome'),
    supabase.from('obreiro_cargos').select('id, nome, nivel').order('nivel', { ascending: false }),
    supabase.from('obreiro_funcoes').select('id, nome').order('nome'),
    supabase.from('obreiro_cadastro').select('congregacao_id, cargo_id, funcao_id'),
  ])

  const erro = congs.error || cargos.error || funcoes.error || obreiros.error
  if (erro) return { ok: false, error: erro.message }

  // Conta o uso de cada item no servidor
  const uso = { congregacao: {}, cargo: {}, funcao: {} }
  for (const o of obreiros.data ?? []) {
    if (o.congregacao_id) uso.congregacao[o.congregacao_id] = (uso.congregacao[o.congregacao_id] || 0) + 1
    if (o.cargo_id)       uso.cargo[o.cargo_id]             = (uso.cargo[o.cargo_id] || 0) + 1
    if (o.funcao_id)      uso.funcao[o.funcao_id]           = (uso.funcao[o.funcao_id] || 0) + 1
  }

  const anexaUso = (lista, mapa) => (lista ?? []).map(i => ({ ...i, emUso: mapa[i.id] || 0 }))

  return {
    ok: true,
    congregacoes: anexaUso(congs.data, uso.congregacao),
    cargos:       anexaUso(cargos.data, uso.cargo),
    funcoes:      anexaUso(funcoes.data, uso.funcao),
  }
}

/** Cria um item. dados: { nome, nivel? (só para cargo) } */
export async function criarItemConfiguracao(tipo, dados) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  const def = TIPOS[tipo]
  if (!def) return { ok: false, error: 'Tipo inválido.' }

  const nome = (dados?.nome || '').trim()
  if (!nome) return { ok: false, error: 'Nome é obrigatório.' }

  const registro = { nome }
  if (tipo === 'cargo') registro.nivel = Number(dados?.nivel) || 0

  const supabase = supabaseAdmin()
  const { data: novo, error } = await supabase
    .from(def.tabela)
    .insert(registro)
    .select('id')
    .single()

  if (error?.code === '23505') return { ok: false, error: `Já existe um item com o nome "${nome}".` }
  if (error) return { ok: false, error: error.message }

  await logSeguro(supabase, {
    acao: 'criar', tabela: def.tabela,
    registroId: novo.id, detalhes: `${def.rotulo} "${nome}" criada`,
  })
  return { ok: true, id: novo.id }
}

/** Renomeia/edita um item. dados: { nome, nivel? } */
export async function editarItemConfiguracao(tipo, id, dados) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  const def = TIPOS[tipo]
  if (!def) return { ok: false, error: 'Tipo inválido.' }
  if (!id) return { ok: false, error: 'Item não informado.' }

  const nome = (dados?.nome || '').trim()
  if (!nome) return { ok: false, error: 'Nome é obrigatório.' }

  const registro = { nome }
  if (tipo === 'cargo') registro.nivel = Number(dados?.nivel) || 0

  const supabase = supabaseAdmin()
  const { error } = await supabase.from(def.tabela).update(registro).eq('id', id)

  if (error?.code === '23505') return { ok: false, error: `Já existe um item com o nome "${nome}".` }
  if (error) return { ok: false, error: error.message }

  await logSeguro(supabase, {
    acao: 'editar', tabela: def.tabela,
    registroId: id, detalhes: `${def.rotulo} renomeada para "${nome}"`,
  })
  return { ok: true }
}

/**
 * Exclui um item — SOMENTE se nenhum obreiro o utiliza.
 * (Excluir um item em uso deixaria cadastros órfãos ou quebraria a FK.)
 */
export async function excluirItemConfiguracao(tipo, id) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  const def = TIPOS[tipo]
  if (!def) return { ok: false, error: 'Tipo inválido.' }
  if (!id) return { ok: false, error: 'Item não informado.' }

  const supabase = supabaseAdmin()

  // Verifica uso antes de excluir
  const { count } = await supabase
    .from('obreiro_cadastro')
    .select('id', { count: 'exact', head: true })
    .eq(def.fk, id)

  if (count > 0) {
    return {
      ok: false,
      error: `Não é possível excluir: ${count} obreiro(s) usam este item. Transfira-os primeiro na tela de edição.`,
    }
  }

  const { data: alvo } = await supabase.from(def.tabela).select('nome').eq('id', id).maybeSingle()
  const { error } = await supabase.from(def.tabela).delete().eq('id', id)

  // 23503 = FK de outra tabela ainda referencia o item
  if (error?.code === '23503') return { ok: false, error: 'Este item é referenciado em outros registros e não pode ser excluído.' }
  if (error) return { ok: false, error: error.message }

  await logSeguro(supabase, {
    acao: 'excluir', tabela: def.tabela,
    registroId: id, detalhes: `${def.rotulo} "${alvo?.nome ?? id}" excluída`,
  })
  return { ok: true }
}