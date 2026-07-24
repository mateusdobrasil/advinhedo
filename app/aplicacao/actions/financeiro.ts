'use server'

import { logAction } from '@/lib/audit'
import { paraMaiusculo } from '@/lib/texto'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function criarCobranca(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // A EBD tem tabela própria (ebd_financeiro); IBV/IBUC continuam na tabela genérica
  const modulo = formData.get('modulo') as string
  const tabela = modulo === 'ebd' ? 'ebd_financeiro' : 'financeiro'

  const aluno_id = formData.get('aluno_id') as string
  const descricao = paraMaiusculo(formData.get('descricao'))
  const valor = parseFloat(formData.get('valor') as string)

  const { error } = await supabase.from(tabela).insert({
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
      tableName: tabela,
      details: `Criou cobrança de R$ ${valor.toFixed(2)} (${descricao}) para o aluno ${aluno?.nome_completo || aluno_id}.`
    })
  }

  revalidatePath(`/aplicacao/${modulo}/admin/financeiro`)
}

export async function marcarComoPago(cobrancaId: string, modulo: string) {
  const supabase = createServerActionClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const tabela = modulo === 'ebd' ? 'ebd_financeiro' : 'financeiro'

  const { data: cobranca, error } = await supabase
    .from(tabela)
    .update({ status: 'Pago' })
    .eq('id', cobrancaId)
    .select('descricao, valor, aluno_id')
    .single()

  if (error) throw new Error(`Erro ao dar baixa na cobrança: ${error.message}`)

  const { data: aluno } = await supabase.from('perfis').select('nome_completo').eq('id', cobranca.aluno_id).single()

  await logAction(supabase, session.user, {
    action: 'BAIXA DE COBRANÇA',
    tableName: tabela,
    details: `Deu baixa na cobrança de R$ ${Number(cobranca.valor).toFixed(2)} (${cobranca.descricao}) do aluno ${aluno?.nome_completo || cobranca.aluno_id}.`
  })

  revalidatePath(`/aplicacao/${modulo}/admin/financeiro`)
}