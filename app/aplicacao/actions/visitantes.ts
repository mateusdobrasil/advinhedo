'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function cadastrarVisitanteEBD(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // 1. Verificação de Segurança
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const nome_completo = formData.get('nome_completo') as string
  const telefone = formData.get('telefone') as string
  const turma_id = formData.get('turma_id') as string

  // 2. Geração automática de credenciais fictícias para o visitante
  // Isso permite que ele entre na tabela 'perfis' sem precisar de um e-mail real agora.
  const emailFicticio = `visitante.${Date.now()}@ebd.local`
  const senhaAleatoria = Math.random().toString(36).slice(-10) + 'V1!'

  // 3. Criação no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: emailFicticio,
    password: senhaAleatoria,
    options: {
      data: {
        nome_completo,
        tipo_usuario: 'VISITANTE',
      }
    }
  })

  if (authError) throw new Error(`Erro ao registar visitante: ${authError.message}`)

  const userId = authData.user?.id
  if (!userId) throw new Error('Não foi possível concluir o registo do visitante.')

  // 4. Atualizar o telefone na tabela de perfis (caso a sua trigger não passe tudo)
  await supabase
    .from('perfis')
    .update({ telefone: telefone })
    .eq('id', userId)

  // 5. Matricular o Visitante automaticamente na Turma da EBD selecionada
  const { error: matriculaError } = await supabase
    .from('matriculas')
    .insert({
      aluno_id: userId,
      turma_id: turma_id,
      status: 'Visitante' // Ajuda a diferenciá-lo dos membros ativos na lista
    })

  if (matriculaError) throw new Error('Visitante criado, mas ocorreu um erro ao vinculá-lo à turma.')

  // Atualiza a página da turma para o visitante aparecer na lista imediatamente
  revalidatePath(`/aplicacao/ibv/admin/turmas/${turma_id}`)
}