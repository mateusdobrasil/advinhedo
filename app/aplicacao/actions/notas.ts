'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function lancarNota(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Coleta os dados do formulário
  const aluno_id = formData.get('aluno_id') as string
  const disciplina = formData.get('disciplina') as string
  const nota = parseFloat(formData.get('nota') as string)
  const faltas = parseInt(formData.get('faltas') as string) || 0
  const semestre = formData.get('semestre') as string

  // Salva no banco de dados
  const { error } = await supabase.from('notas').insert({
    aluno_id,
    disciplina,
    nota,
    faltas,
    semestre,
  })

  if (error) {
    console.error("Erro ao lançar nota:", error)
    throw new Error('Falha ao lançar nota no sistema.')
  }

  // COLE ISSO DEPOIS QUE O SEU CÓDIGO FIZER UM INSERT/UPDATE IMPORTANTE

  // 1. Descobre quem é o Admin que está fazendo a ação
  const { data: { session } } = await supabase.auth.getSession()
  
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

  // Atualiza as páginas em cache para a nota aparecer na hora
  revalidatePath('/aplicacao/ibv/admin')
  revalidatePath('/aplicacao/ibv/notas')
}