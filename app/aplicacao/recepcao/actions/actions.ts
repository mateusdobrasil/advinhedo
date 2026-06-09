'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Função para reverter ou alterar o status de apresentação
export async function toggleStatusApresentacao(id: string, statusAtual: boolean) {
  const supabase = createServerActionClient({ cookies })
  
  const { error } = await supabase
    .from('visitantes')
    .update({ foi_apresentado: !statusAtual })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar status:', error)
    return { success: false, error: error.message }
  }

  // Corrigido para refletir as rotas exatas do seu sistema
  revalidatePath('/apresentacao/edicao')
  revalidatePath('/apresentacao/apresentacao') // <-- Caminho corrigido aqui
  return { success: true }
}

// Função para deletar um cadastro (se necessário)
export async function deletarCadastro(id: string) {
  const supabase = createServerActionClient({ cookies })
  
  const { error } = await supabase
    .from('visitantes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar:', error)
    return { success: false, error: error.message }
  }

  // Atualiza a tabela de edição para o item sumir da tela na hora
  revalidatePath('/apresentacao/edicao')
  return { success: true }
}