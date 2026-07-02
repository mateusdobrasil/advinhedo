'use server'

/**
 * app/aplicacao/actions/obreiro-novo.js
 *
 * Cadastro de novo obreiro, no padrão das demais actions
 * (cookie via verificarAuthReuniao + service role key).
 *
 * O número de cadastro é calculado NO SERVIDOR, com retry em caso de
 * colisão — dois dispositivos cadastrando ao mesmo tempo não geram
 * mais números duplicados (desde que exista a constraint UNIQUE em
 * "cadastro"; veja o comentário no fim do arquivo).
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

/** Listas de apoio do formulário (congregações, cargos, funções) */
export async function carregarListasApoio() {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO

  const supabase = supabaseAdmin()
  const [congs, cargos, funcoes] = await Promise.all([
    supabase.from('obreiro_congregacoes').select('id, nome').order('nome'),
    supabase.from('obreiro_cargos').select('id, nome, nivel').order('nivel', { ascending: false }),
    supabase.from('obreiro_funcoes').select('id, nome').order('nome'),
  ])

  const erro = congs.error || cargos.error || funcoes.error
  if (erro) return { ok: false, error: erro.message }

  return {
    ok: true,
    congregacoes: congs.data ?? [],
    cargos: cargos.data ?? [],
    funcoes: funcoes.data ?? [],
  }
}

/**
 * Cria o obreiro. Retorna { ok: true, id } ou { ok: false, error }.
 * - Whitelist de campos (nunca aceita face_descriptor/foto_url aqui)
 * - Número de cadastro calculado no servidor, com até 3 tentativas
 *   em caso de colisão simultânea (código 23505)
 */
export async function criarObreiro(payload) {
  if (!(await verificarAuthReuniao())) return NAO_AUTENTICADO

  const dados = {
    situacao:        payload.situacao === 'Inativo' ? 'Inativo' : 'Ativo',
    nome:            (payload.nome || '').trim(),
    congregacao_id:  payload.congregacao_id  || null,
    cargo_id:        payload.cargo_id        || null,
    funcao_id:       payload.funcao_id       || null,
    cpf:             payload.cpf             || null,
    data_nascimento: payload.data_nascimento || null,
    telefone:        payload.telefone        || null,
    email:           payload.email ? String(payload.email).toLowerCase() : null,
  }

  if (!dados.nome) return { ok: false, error: 'Nome é obrigatório.' }

  const supabase = supabaseAdmin()

  // Até 3 tentativas: se dois cadastros simultâneos colidirem no
  // número (23505), recalcula e tenta de novo
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    // maybeSingle: não quebra com a tabela vazia (primeiro obreiro)
    const { data: ultimo } = await supabase
      .from('obreiro_cadastro')
      .select('cadastro')
      .order('cadastro', { ascending: false })
      .limit(1)
      .maybeSingle()

    const proximoCadastro = (ultimo?.cadastro || 0) + 1

    const { data: novo, error } = await supabase
      .from('obreiro_cadastro')
      .insert({ ...dados, cadastro: proximoCadastro })
      .select('id')
      .single()

    if (error?.code === '23505' && tentativa < 3) continue // colisão: tenta de novo
    if (error) return { ok: false, error: error.message }

    // Log de auditoria (não bloqueia o sucesso se falhar)
    try {
      await registrarLogReuniao(supabase, {
        acao: 'criar',
        tabela: 'obreiro_cadastro',
        registroId: novo.id,
        detalhes: `Obreiro "${dados.nome}" cadastrado`,
      })
    } catch (e) {
      console.error('Falha ao registrar log de auditoria:', e?.message)
    }

    return { ok: true, id: novo.id }
  }

  return { ok: false, error: 'Não foi possível gerar o número de cadastro. Tente novamente.' }
}

/*
 * SQL RECOMENDADO (rode uma vez no Supabase) — sem esta constraint,
 * o retry acima não tem como detectar a colisão de números:
 *
 *   ALTER TABLE obreiro_cadastro
 *     ADD CONSTRAINT uq_obreiro_cadastro_numero UNIQUE (cadastro);
 *
 * Se der erro por já existirem números duplicados, encontre-os com:
 *
 *   SELECT cadastro, COUNT(*) FROM obreiro_cadastro
 *   GROUP BY cadastro HAVING COUNT(*) > 1;
 */