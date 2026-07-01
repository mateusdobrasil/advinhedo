'use server'

import { logAction } from '@/lib/audit'
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
  const { error } = await supabase.from('ibv_notas').insert({
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

  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    const { data: aluno } = await supabase.from('perfis').select('nome_completo').eq('id', aluno_id).single()

    await logAction(supabase, session.user, {
      action: 'LANÇAMENTO DE NOTA',
      tableName: 'ibv_notas',
      details: `Lançou nota ${nota} e ${faltas} faltas para o aluno ${aluno?.nome_completo || aluno_id} na disciplina ${disciplina}.`
    })
  }

  // Atualiza as páginas em cache para a nota aparecer na hora
  revalidatePath('/aplicacao/ibv/admin')
  revalidatePath('/aplicacao/ibv/notas')
}