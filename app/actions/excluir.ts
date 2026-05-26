'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function excluirNota(id: string, alunoId: string) {
  const supabase = createServerActionClient({ cookies })
  const { error } = await supabase.from('notas').delete().eq('id', id)
  
  if (error) throw new Error('Erro ao excluir nota')
  revalidatePath(`/ibv/admin/aluno/${alunoId}`)
}

export async function excluirFatura(id: string, alunoId: string) {
  const supabase = createServerActionClient({ cookies })
  const { error } = await supabase.from('financeiro').delete().eq('id', id)
  
  if (error) throw new Error('Erro ao excluir fatura')
  revalidatePath(`/ibv/admin/aluno/${alunoId}`)
}