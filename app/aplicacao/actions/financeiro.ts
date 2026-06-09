'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function criarCobranca(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.from('financeiro').insert({
    aluno_id: formData.get('aluno_id') as string,
    descricao: formData.get('descricao') as string,
    valor: parseFloat(formData.get('valor') as string),
    data_vencimento: formData.get('data_vencimento') as string,
    status: 'Pendente'
  })

  if (error) {
    console.error("ERRO AO CRIAR COBRANÇA:", error)
    throw new Error(`Erro ao registrar a cobrança: ${error.message}`)
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

  revalidatePath('/aplicacao/ibv/admin/financeiro')
}