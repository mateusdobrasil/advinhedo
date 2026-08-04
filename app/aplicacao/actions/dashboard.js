'use server'

/**
 * app/aplicacao/actions/dashboard.js
 *
 * Dados do dashboard de presenças, carregados NO SERVIDOR em uma
 * única action — valida o cookie (verificarAuthReuniao) e usa a
 * service role key.
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
 * Retorna tudo que o dashboard (e o relatório do pastor) precisam:
 * { ok: true, reunioes, obreiros, presencas } ou { ok: false, error }
 */
export async function carregarDashboard() {
  if (!(await verificarAuthReuniao())) {
    return { ok: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const supabase = supabaseAdmin()

  const [reuns, obs, pres] = await Promise.all([
    supabase
      .from('obreiro_reunioes')
      .select('id, titulo, data_reuniao, hora_inicio, hora_fim, local, descricao, aberta')
      .eq('ativa', true)
      .order('data_reuniao', { ascending: false }),
    supabase
      .from('obreiro_cadastro')
      // + obreiro_funcoes(nome): necessário para o relatório do pastor
      .select('id, nome, data_nascimento, obreiro_congregacoes(nome), obreiro_cargos(nome), obreiro_funcoes(nome)')
      .eq('situacao', 'Ativo'),
    supabase
      .from('obreiro_presencas')
      .select('reuniao_id, obreiro_id, presente'),
  ])

  const erro = reuns.error || obs.error || pres.error
  if (erro) return { ok: false, error: erro.message }

  return {
    ok: true,
    reunioes: reuns.data ?? [],
    obreiros: obs.data ?? [],
    presencas: pres.data ?? [],
  }
}