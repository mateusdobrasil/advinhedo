'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function excluirFatura(id: string, modulo: string) {
  const supabase = createServerActionClient({ cookies })
  const { error } = await supabase.from(`${modulo}_financeiro`).delete().eq('id', id)

  if (error) throw new Error('Erro ao excluir fatura')
  revalidatePath(`/aplicacao/${modulo}/admin/financeiro`)
}

export async function excluirDiario(id: string, modulo: string) {
  const supabase = createServerActionClient({ cookies })
  const { error } = await supabase.from(`${modulo}_diario_classe`).delete().eq('id', id)

  if (error) throw new Error('Erro ao excluir lançamento do diário')
  revalidatePath(`/aplicacao/${modulo}/admin/diario`)
}