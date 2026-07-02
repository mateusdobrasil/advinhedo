'use server'

/**
 * app/aplicacao/actions/obreiro-foto.js
 *
 * Cadastro de foto + descritor facial, no padrão das demais actions
 * (cookie via verificarAuthReuniao + service role key).
 *
 * O upload da foto NÃO passa pela action (server actions têm limite
 * de ~1MB de body). Em vez disso:
 *   1. gerarUploadFoto() cria uma SIGNED UPLOAD URL com a service role
 *      — um token de uso único que autoriza gravar aquele arquivo
 *   2. O navegador envia o arquivo direto ao Storage com esse token
 *   3. salvarDadosFaciais() grava foto_url + face_descriptor no banco
 *
 * Com isso, o bucket não precisa de NENHUMA policy de escrita pública.
 */

import { createClient } from '@supabase/supabase-js'
import { verificarAuthReuniao } from '@/app/aplicacao/actions/reunioes-auth'

const BUCKET = 'fotos-obreiros'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

const NAO_AUTENTICADO = { ok: false, error: 'Sessão expirada. Faça login novamente.' }

/** Dados do obreiro para a tela de foto */
export async function carregarObreiroFoto(id) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!id) return { ok: false, error: 'Obreiro não informado.' }

  const { data, error } = await supabaseAdmin()
    .from('obreiro_cadastro')
    .select('id, nome, foto_url, obreiro_congregacoes(nome)')
    .eq('id', id)
    .single()

  if (error) return { ok: false, error: 'Obreiro não encontrado.' }
  return { ok: true, obreiro: data }
}

/**
 * Gera a URL assinada de upload para a foto do obreiro.
 * Remove o arquivo anterior antes (equivalente ao upsert).
 * Retorna { ok: true, path, token } ou { ok: false, error }
 */
export async function gerarUploadFoto(obreiroId) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!obreiroId) return { ok: false, error: 'Obreiro não informado.' }

  const supabase = supabaseAdmin()

  // Confirma que o obreiro existe (evita gerar tokens para IDs inventados)
  const { data: existe } = await supabase
    .from('obreiro_cadastro')
    .select('id')
    .eq('id', obreiroId)
    .single()
  if (!existe) return { ok: false, error: 'Obreiro não encontrado.' }

  const path = `${obreiroId}.jpg`

  // Remove a foto anterior, se houver (signed upload não sobrescreve)
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {})

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error) return { ok: false, error: error.message }
  return { ok: true, path: data.path, token: data.token }
}

/**
 * Grava foto_url + face_descriptor após o upload concluído.
 * O descritor é validado no servidor: precisa ser um array de
 * exatamente 128 números finitos (formato do face-api).
 */
export async function salvarDadosFaciais(obreiroId, descriptor) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO
  if (!obreiroId) return { ok: false, error: 'Obreiro não informado.' }

  if (
    !Array.isArray(descriptor) ||
    descriptor.length !== 128 ||
    !descriptor.every(n => typeof n === 'number' && Number.isFinite(n))
  ) {
    return { ok: false, error: 'Descritor facial inválido.' }
  }

  const supabase = supabaseAdmin()
  const path = `${obreiroId}.jpg`

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  // Cache-buster: mesmo nome de arquivo faz o navegador mostrar a
  // foto antiga em outras telas; o ?v= força a atualização
  const fotoUrl = `${publicUrl}?v=${Date.now()}`

  const { error } = await supabase
    .from('obreiro_cadastro')
    .update({ foto_url: fotoUrl, face_descriptor: descriptor })
    .eq('id', obreiroId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}