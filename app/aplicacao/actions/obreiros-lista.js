'use server'

/**
 * app/aplicacao/actions/obreiros-lista.js
 *
 * Listagem de obreiros (ativos e inativos) para a tela de cadastros,
 * no padrão das demais actions (cookie + service role).
 *
 * Privacidade: o face_descriptor NUNCA é enviado ao navegador por
 * esta action — a tela só precisa saber SE existe foto cadastrada,
 * então devolvemos o booleano tem_descritor calculado no servidor.
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

/**
 * Todos os obreiros (Ativo e Inativo), com o indicador de foto.
 * Retorna { ok, obreiros: [{ id, nome, foto_url, situacao,
 *   tem_descritor, obreiro_congregacoes, obreiro_cargos }] }
 */
export async function listarObreirosAdmin() {
  if (!(await verificarAuthReuniao())) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const { data, error } = await supabaseAdmin()
    .from('obreiro_cadastro')
    .select('id, nome, foto_url, situacao, face_descriptor, obreiro_congregacoes(nome), obreiro_cargos(nome)')
    .order('nome')

  if (error) return { ok: false, error: error.message }

  // Converte o descritor em booleano ANTES de sair do servidor
  const obreiros = (data ?? []).map(o => {
    const { face_descriptor, ...resto } = o
    return { ...resto, tem_descritor: face_descriptor != null }
  })

  return { ok: true, obreiros }
}