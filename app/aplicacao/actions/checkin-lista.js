'use server'

/**
 * app/aplicacao/actions/checkin-lista.js
 *
 * Operações de banco da página principal de check-in (lista/kiosk),
 * executadas NO SERVIDOR — mesmo padrão do checkin-facial.js:
 * valida o cookie (verificarAuthReuniao) e usa a service role key.
 */

import { createClient } from '@supabase/supabase-js'
import { verificarAuthReuniao } from '@/app/aplicacao/actions/reunioes-auth'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

const NAO_AUTENTICADO = { ok: false, error: 'Sessão expirada. Faça login novamente.' }

/** Reuniões abertas para check-in */
export async function listarReunioesAbertas() {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO

  const { data, error } = await supabaseAdmin()
    .from('obreiro_reunioes')
    .select('id, titulo, data_reuniao')
    .eq('aberta', true)
    .eq('ativa', true)
    .order('data_reuniao', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, reunioes: data ?? [] }
}

/** Obreiros ativos (SEM face_descriptor — a lista não precisa dele) */
export async function listarObreiros() {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO

  const { data, error } = await supabaseAdmin()
    .from('obreiro_cadastro')
    .select('id, nome, cpf, foto_url, obreiro_congregacoes(nome), obreiro_cargos(nome)')
    .eq('situacao', 'Ativo')
    .order('nome')

  if (error) return { ok: false, error: error.message }
  return { ok: true, obreiros: data ?? [] }
}

/** Presenças de uma reunião (usada no carregamento e no polling) */
export async function listarPresencas(reuniaoId) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!reuniaoId) return { ok: false, error: 'Reunião não informada.' }

  const { data, error } = await supabaseAdmin()
    .from('obreiro_presencas')
    .select('id, obreiro_id, presente')
    .eq('reuniao_id', reuniaoId)

  if (error) return { ok: false, error: error.message }
  return { ok: true, presencas: data ?? [] }
}

/**
 * Marca presença (lista, qrcode ou facial).
 * Reaproveita a linha desmarcada anteriormente, em vez de duplicar.
 * Retorna:
 *   { ok: true, presenca }          → registrado agora
 *   { ok: true, jaPresente: true }  → já estava presente
 *   { ok: false, error }
 */
export async function marcarPresenca(reuniaoId, obreiroId, metodo = 'lista') {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!reuniaoId || !obreiroId) return { ok: false, error: 'Dados incompletos.' }

  const supabase = supabaseAdmin()

  const { data: existente } = await supabase
    .from('obreiro_presencas')
    .select('id, presente')
    .eq('reuniao_id', reuniaoId)
    .eq('obreiro_id', obreiroId)
    .maybeSingle()

  if (existente?.presente) return { ok: true, jaPresente: true }

  const { data, error } = existente
    ? await supabase.from('obreiro_presencas')
        .update({ presente: true, metodo_checkin: metodo })
        .eq('id', existente.id)
        .select('id, obreiro_id, presente')
        .single()
    : await supabase.from('obreiro_presencas')
        .insert({ reuniao_id: reuniaoId, obreiro_id: obreiroId, presente: true, metodo_checkin: metodo })
        .select('id, obreiro_id, presente')
        .single()

  // Corrida entre dois dispositivos: a constraint UNIQUE segura
  if (error?.code === '23505') return { ok: true, jaPresente: true }
  if (error) return { ok: false, error: error.message }
  return { ok: true, presenca: data }
}

/** Desmarca presença (toggle da lista) */
export async function removerPresenca(reuniaoId, obreiroId) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!reuniaoId || !obreiroId) return { ok: false, error: 'Dados incompletos.' }

  const { error } = await supabaseAdmin()
    .from('obreiro_presencas')
    .update({ presente: false })
    .eq('reuniao_id', reuniaoId)
    .eq('obreiro_id', obreiroId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}