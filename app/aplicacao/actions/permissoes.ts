'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function atualizarPermissao(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // 1. SEGURANÇA: Verifica quem está disparando a ação
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Usuário não autenticado.')
  }

  // Busca o perfil de quem clicou no botão de salvar
  const { data: adminLogado } = await supabase
    .from('perfis')
    .select('nome_completo, tipo_usuario')
    .eq('id', session.user.id)
    .single()

  // Bloqueia a ação se quem clicou não for um Administrador
  if (!adminLogado?.tipo_usuario?.toLowerCase().includes('administrador')) {
    throw new Error('Acesso negado: Apenas administradores podem alterar permissões.')
  }

  // 2. PREPARAÇÃO DOS DADOS
  const idAlvo = formData.get('id') as string
  
  // Pega todos os cargos marcados (Se vier vazio, cai pro padrão Aluno)
  const permissoesArray = formData.getAll('tipo_usuario') as string[]
  const tipo_usuario = permissoesArray.length > 0 ? permissoesArray.join(', ') : 'Aluno'

  // Pega todos os polos marcados (Se vier vazio, cai pro padrão IBV)
  const polosArray = formData.getAll('polo') as string[]
  const polo = polosArray.length > 0 ? polosArray.join(', ') : 'IBV'

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
    throw new Error(`Erro ao atualizar: ${error.message}`)
  }

  // 4. REGISTRO DE AUDITORIA DEFINITIVO
  await logAction(supabase, session.user, {
    action: 'ALTERAÇÃO DE ACESSO',
    tableName: 'perfis',
    details: `Alterou acessos de ${nomeAlvo} para os cargos [ ${tipo_usuario} ] e polos [ ${polo} ].`
  })
  
  // 5. ATUALIZA A TELA
  revalidatePath('/aplicacao/ibv/admin/permissoes')
}