'use server'

import { logAction } from '@/lib/audit'
import { paraMaiusculo } from '@/lib/texto'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ehAdministrador, usuarioTemAcessoPagina } from '@/lib/permissoes'

// Retorna { ok, error } em vez de lançar exceção: em produção o Next.js
// substitui a mensagem de qualquer erro lançado (throw) dentro de uma Server
// Action por um texto genérico ("An error occurred in the Server Components
// render...") pra não vazar detalhes do servidor. Isso escondia a causa real
// do erro no modal de Editar Permissões — retornando o erro como dado normal,
// a mensagem verdadeira chega até o cliente.
export async function atualizarPermissao(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })

    // 1. SEGURANÇA: Verifica quem está disparando a ação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { ok: false, error: 'Usuário não autenticado.' }
    }

    // Busca o perfil de quem clicou no botão de salvar
    const { data: adminLogado } = await supabase
      .from('perfis')
      .select('nome_completo, tipo_usuario')
      .eq('id', session.user.id)
      .single()

    // Libera quem for Administrador (acesso total fixo) OU quem tiver acesso
    // liberado à página "permissoes" em algum dos módulos — mesma checagem
    // usada pra exibir a própria página. Antes essa ação exigia literalmente
    // o cargo "Administrador", ignorando cargos customizados (ex: TI EBD) que
    // já tinham acesso à página via tabela permissoes_paginas — por isso um
    // TI EBD conseguia abrir a tela mas levava "Acesso negado" ao salvar.
    const podeAlterar =
      ehAdministrador(adminLogado?.tipo_usuario) ||
      (await Promise.all(
        ['ebd', 'ibv', 'ibuc'].map((modulo) =>
          usuarioTemAcessoPagina(supabase, adminLogado?.tipo_usuario, modulo, 'permissoes')
        )
      )).some(Boolean)

    if (!podeAlterar) {
      return { ok: false, error: 'Acesso negado: você não tem permissão para alterar acessos.' }
    }

    // 2. PREPARAÇÃO DOS DADOS
    const idAlvo = formData.get('id') as string

    // Pega todos os cargos marcados (Se vier vazio, cai pro padrão Aluno)
    const permissoesArray = formData.getAll('tipo_usuario') as string[]
    const tipo_usuario = permissoesArray.length > 0 ? permissoesArray.join(', ') : 'Aluno'

    // Pega todos os polos marcados (Se vier vazio, cai pro padrão IBV)
    const polosArray = formData.getAll('polo') as string[]
    const polo = polosArray.length > 0 ? polosArray.map(p => paraMaiusculo(p)).join(', ') : 'IBV'

    // Opcional: Busca o nome da pessoa que está sofrendo a alteração para deixar o log bonito
    const { data: usuarioAlvo } = await supabase
      .from('perfis')
      .select('nome_completo')
      .eq('id', idAlvo)
      .single()

    const nomeAlvo = usuarioAlvo?.nome_completo || idAlvo

    // 3. EXECUTA A ATUALIZAÇÃO
    const { error } = await supabase
      .from('perfis')
      .update({ tipo_usuario, polo })
      .eq('id', idAlvo)

    if (error) {
      console.error("ERRO AO ATUALIZAR PERMISSÃO E POLO:", error)
      return { ok: false, error: `Erro ao atualizar: ${error.message}` }
    }

    // 4. REGISTRO DE AUDITORIA DEFINITIVO
    try {
      await logAction(supabase, session.user, {
        action: 'ALTERAÇÃO DE ACESSO',
        tableName: 'perfis',
        details: `Alterou acessos de ${nomeAlvo} para os cargos [ ${tipo_usuario} ] e polos [ ${polo} ].`
      })
    } catch (erroAuditoria) {
      // A atualização já foi salva com sucesso — um erro só no registro de
      // auditoria não deve impedir o admin de ver que funcionou.
      console.error("ERRO AO REGISTRAR AUDITORIA (permissão já foi salva):", erroAuditoria)
    }

    // 5. ATUALIZA A TELA
    for (const modulo of ['ebd', 'ibv', 'ibuc']) {
      revalidatePath(`/aplicacao/${modulo}/admin/permissoes`)
    }

    return { ok: true }
  } catch (erroInesperado: any) {
    console.error("ERRO INESPERADO EM atualizarPermissao:", erroInesperado)
    return { ok: false, error: erroInesperado?.message || 'Erro inesperado ao atualizar permissões.' }
  }
}