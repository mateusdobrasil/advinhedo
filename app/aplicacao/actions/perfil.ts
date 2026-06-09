'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function atualizarPerfil(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Pega quem está logado
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const nome = formData.get('nome') as string
  const novaSenha = formData.get('senha') as string

  // 1. Atualiza o nome na tabela 'perfis'
  if (nome) {
    const { error: perfilError } = await supabase
      .from('perfis')
      .update({ nome_completo: nome })
      .eq('id', session.user.id)

    if (perfilError) throw new Error('Erro ao atualizar o nome.')
  }
 

  // 2. Atualiza a senha (se o usuário digitou alguma coisa)
  if (novaSenha && novaSenha.length >= 6) {
    const { error: authError } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (authError) throw new Error('Erro ao atualizar a senha. A senha deve ter no mínimo 6 caracteres.')
  }

  // COLE ISSO DEPOIS QUE O SEU CÓDIGO FIZER UM INSERT/UPDATE IMPORTANTE

  // 1. Descobre quem é o Admin que está fazendo a ação  
  if (session) {
    const { data: admin } = await supabase
      .from('perfis')
      .select('nome_completo')
      .eq('id', session.user.id)
      .single()

    // 2. Grava a ação no banco
    await supabase.from('auditoria').insert({
      usuario_id: session.user.id,
      usuario_nome: admin?.nome_completo || 'Sistema',
      acao: 'NOME DA AÇÃO (Ex: NOVA MATRÍCULA)',
      tabela_afetada: 'nome_da_tabela',
      detalhes: `Descreva o que aconteceu aqui.`
    })
  }

  // Atualiza as páginas que mostram o nome do usuário
  revalidatePath('/aplicacao/ibv')
  revalidatePath('/aplicacao/ibv/perfil')
}