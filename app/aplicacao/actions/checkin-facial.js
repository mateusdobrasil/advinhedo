'use server'

/**
 * app/aplicacao/actions/checkin-facial.js
 *
 * Operações de banco do check-in facial, executadas NO SERVIDOR.
 * - Valida o cookie de sessão (verificarAuthReuniao) antes de tudo
 * - Usa a SERVICE ROLE KEY, que ignora RLS e nunca chega ao navegador
 * - Com isso, o RLS das tabelas pode ficar fechado para anon/authenticated
 *
 * REQUISITO: adicione no .env (e nas env vars da hospedagem):
 *   SUPABASE_SERVICE_ROLE_KEY=...   ← SEM o prefixo NEXT_PUBLIC_!
 * A chave está em: Dashboard → Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js'
import { verificarAuthReuniao } from '@/app/aplicacao/actions/reunioes-auth'

// Cliente admin — só existe no servidor
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Carrega os obreiros ativos com descritor facial cadastrado.
 * Retorna: { ok: true, obreiros: [...] } ou { ok: false, error }
 */
export async function carregarObreirosFacial() {
  const autenticado = await verificarAuthReuniao()
  if (!autenticado) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('obreiro_cadastro')
    .select('id, nome, foto_url, face_descriptor, obreiro_congregacoes(nome), obreiro_cargos(nome)')
    .eq('situacao', 'Ativo')
    .not('face_descriptor', 'is', null)

  if (error) return { ok: false, error: error.message }
  return { ok: true, obreiros: data ?? [] }
}

/**
 * Registra a presença de um obreiro em uma reunião.
 * Retorna:
 *   { ok: true }                → registrado
 *   { ok: false, jaPresente: true } → já havia check-in (constraint UNIQUE)
 *   { ok: false, error }        → outro erro
 */
export async function registrarPresenca(reuniaoId, obreiroId) {
  const autenticado = await verificarAuthReuniao()
  if (!autenticado) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  if (!reuniaoId || !obreiroId) {
    return { ok: false, error: 'Dados incompletos para o registro.' }
  }

  const supabase = supabaseAdmin()
  const { error } = await supabase.from('obreiro_presencas').insert({
    reuniao_id: reuniaoId,
    obreiro_id: obreiroId,
    presente: true,
    metodo_checkin: 'facial',
  })

  if (error?.code === '23505') return { ok: false, jaPresente: true }
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}