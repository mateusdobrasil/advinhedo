'use server'

/**
 * app/aplicacao/actions/checkin-cpf.js
 *
 * Check-in por cartão (código de barras / QR com CPF), no padrão das
 * demais actions. O navegador envia APENAS o CPF lido; a busca do
 * obreiro e o registro acontecem no servidor — a lista de CPFs nunca
 * trafega para o dispositivo.
 *
 * Reaproveita marcarPresenca() do checkin-lista para gravar.
 */

import { createClient } from '@supabase/supabase-js'
import { verificarAuthReuniao } from '@/app/aplicacao/actions/reunioes-auth'
import { marcarPresenca } from '@/app/aplicacao/actions/checkin-lista'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function normalizarCPF(cpf) {
  return (cpf || '').replace(/\D/g, '')
}

/**
 * Faz o check-in a partir do CPF lido no cartão.
 * Retorna:
 *   { ok: true, obreiro }                    → presença registrada
 *   { ok: true, obreiro, jaPresente: true }  → já estava presente
 *   { ok: false, naoEncontrado: true }       → CPF não cadastrado
 *   { ok: false, cpfInvalido: true }         → código lido não é um CPF
 *   { ok: false, error }                     → outro erro
 */
export async function checkinPorCPF(reuniaoId, codigoLido) {
  if (!(await verificarAuthReuniao())) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }
  if (!reuniaoId) return { ok: false, error: 'Reunião não informada.' }

  const cpf = normalizarCPF(codigoLido)
  if (cpf.length !== 11) return { ok: false, cpfInvalido: true }

  const supabase = supabaseAdmin()

  // Busca os obreiros ativos e compara CPFs normalizados no servidor
  // (o CPF pode estar gravado com ou sem pontuação no banco)
  const { data: obreiros, error } = await supabase
    .from('obreiro_cadastro')
    .select('id, nome, cpf, obreiro_congregacoes(nome), obreiro_cargos(nome)')
    .eq('situacao', 'Ativo')
    .not('cpf', 'is', null)

  if (error) return { ok: false, error: error.message }

  const encontrado = obreiros?.find(o => normalizarCPF(o.cpf) === cpf)
  if (!encontrado) return { ok: false, naoEncontrado: true }

  const res = await marcarPresenca(reuniaoId, encontrado.id, 'qrcode')
  if (!res.ok) return { ok: false, error: res.error }

  // Não devolve o CPF ao navegador — só o necessário para exibir
  const obreiro = {
    id: encontrado.id,
    nome: encontrado.nome,
    obreiro_congregacoes: encontrado.obreiro_congregacoes,
    obreiro_cargos: encontrado.obreiro_cargos,
  }

  return { ok: true, obreiro, jaPresente: res.jaPresente === true }
}