'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function lancarDiario(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // 1. Descobre quem é o Administrador/Professor que está fazendo o lançamento
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Usuário não autenticado.')

  // 2. Pega os dados do formulário
  const aluno_id = formData.get('aluno_id') as string
  const turma_id = formData.get('turma_id') as string
  const materia_id = formData.get('materia_id') as string
  const faltas = parseInt(formData.get('faltas') as string)
  const nota = parseFloat(formData.get('nota') as string)

  // 3. SALVA A NOTA NO DIÁRIO
  const { error: diarioError } = await supabase
    .from('diario_classe')
    .insert({
      aluno_id,
      turma_id,
      materia_id,
      faltas,
      nota
    })

  if (diarioError) {
    console.error("Erro ao salvar no diário:", diarioError)
    throw new Error('Não foi possível salvar o registro no banco.')
  }

  // 👇 NOVA BUSCA: Pegar o nome do aluno para o log
  const { data: aluno } = await supabase
    .from('perfis')
    .select('nome_completo')
    .eq('id', aluno_id)
    .single()

  const nomeAluno = aluno?.nome_completo || 'Aluno Desconhecido'
  
  // 4. O ESPIÃO DA AUDITORIA (Agora com o nome do aluno!)
  await logAction(supabase, session.user, {
    action: 'LANÇAMENTO DE NOTA',
    tableName: 'diario_classe',
    details: `Lançou nota ${nota} e ${faltas} faltas para o aluno: ${nomeAluno}`
  })

  revalidatePath('/aplicacao/ibv/admin/diario')
  revalidatePath('/aplicacao/ibv/admin/auditoria')
}