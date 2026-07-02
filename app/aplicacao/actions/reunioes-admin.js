'use server'

/**
 * app/aplicacao/actions/reunioes-admin.js
 *
 * Operações do hub admin de reuniões, no padrão das demais actions
 * (cookie via verificarAuthReuniao + service role key).
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

async function logSeguro(supabase, dados) {
  try {
    await registrarLogReuniao(supabase, dados)
  } catch (e) {
    console.error('Falha ao registrar log de auditoria:', e?.message)
  }
}

/**
 * Reuniões ativas com contagem de presenças já calculada no servidor
 * (em vez de baixar todas as linhas de presença para o navegador).
 * Retorna { ok, reunioes: [{ ..., presentes, totalCheckins }] }
 */
export async function listarReunioesAdmin() {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO

  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('obreiro_reunioes')
    .select('id, titulo, data_reuniao, hora_inicio, local, aberta, presencas:obreiro_presencas(presente)')
    .eq('ativa', true)
    .order('data_reuniao', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const reunioes = (data ?? []).map(r => {
    const totalCheckins = r.presencas?.length || 0
    const presentes     = r.presencas?.filter(p => p.presente).length || 0
    const { presencas, ...resto } = r
    return { ...resto, presentes, totalCheckins }
  })

  return { ok: true, reunioes }
}

/** Cria uma reunião (aberta e ativa) */
export async function criarReuniao(payload) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO

  const titulo = (payload.titulo || '').trim()
  if (!titulo) return { ok: false, error: 'Título é obrigatório.' }
  if (!payload.data_reuniao) return { ok: false, error: 'Data é obrigatória.' }

  const supabase = supabaseAdmin()
  const { data: nova, error } = await supabase
    .from('obreiro_reunioes')
    .insert({
      titulo,
      data_reuniao: payload.data_reuniao,
      hora_inicio:  payload.hora_inicio || null,
      hora_fim:     payload.hora_fim    || null,
      local:        payload.local       || null,
      descricao:    payload.descricao   || null,
      aberta:       true,
      ativa:        true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await logSeguro(supabase, {
    acao: 'criar', tabela: 'obreiro_reunioes',
    registroId: nova.id, detalhes: `Reunião "${titulo}" criada`,
  })

  return { ok: true, id: nova.id }
}

/**
 * Altera o status de uma reunião.
 * operacao: 'encerrar' | 'reabrir' | 'inativar'
 * (whitelist de operações — a action nunca aceita campos arbitrários)
 */
export async function alterarStatusReuniao(id, operacao) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!id) return { ok: false, error: 'Reunião não informada.' }

  const operacoes = {
    encerrar: { campos: { aberta: false }, acao: 'editar',   sufixo: 'encerrada' },
    reabrir:  { campos: { aberta: true },  acao: 'editar',   sufixo: 'reaberta'  },
    inativar: { campos: { ativa: false },  acao: 'inativar', sufixo: 'inativada' },
  }
  const op = operacoes[operacao]
  if (!op) return { ok: false, error: 'Operação inválida.' }

  const supabase = supabaseAdmin()

  const { data: alvo } = await supabase
    .from('obreiro_reunioes')
    .select('titulo')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase
    .from('obreiro_reunioes')
    .update(op.campos)
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  await logSeguro(supabase, {
    acao: op.acao, tabela: 'obreiro_reunioes',
    registroId: id, detalhes: `Reunião "${alvo?.titulo ?? id}" ${op.sufixo}`,
  })

  return { ok: true }
}