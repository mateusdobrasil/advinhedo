'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function criarCobranca(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  const aluno_id = formData.get('aluno_id') as string
  const descricao = formData.get('descricao') as string
  const valor = parseFloat(formData.get('valor') as string)

  const { error } = await supabase.from('financeiro').insert({
    aluno_id,
    descricao,
    valor,
    data_vencimento: formData.get('data_vencimento') as string,
    status: 'Pendente'
  })

  if (error) {
    console.error("ERRO AO CRIAR COBRANÇA:", error)
    throw new Error(`Erro ao registrar a cobrança: ${error.message}`)
  }

  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    const { data: aluno } = await supabase.from('perfis').select('nome_completo').eq('id', aluno_id).single()

    await logAction(supabase, session.user, {
      action: 'CRIAÇÃO DE COBRANÇA',
      tableName: 'financeiro',
      details: `Criou cobrança de R$ ${valor.toFixed(2)} (${descricao}) para o aluno ${aluno?.nome_completo || aluno_id}.`
    })
  }

  revalidatePath('/aplicacao/ibv/admin/financeiro')
}