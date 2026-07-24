'use server'

import { logAction } from '@/lib/audit'
import { paraMaiusculo } from '@/lib/texto'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function salvarPolo(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const id = formData.get('id') as string // Se houver ID, é edição
  const nome = paraMaiusculo(formData.get('nome'))
  const cidade = formData.get('cidade') as string
  const tipo = formData.get('tipo') as string

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  // 1. Salva ou Atualiza o Polo
  const { error } = await supabase
    .from('polos')
    .upsert({
      ...(id ? { id } : {}), // Só inclui o ID se for edição
      nome,
      cidade,
      tipo
    })

  if (error) throw new Error(error.message)

  // 2. Registro na Auditoria com a função centralizada
  await logAction(supabase, session.user, {
    action: id ? 'EDIÇÃO DE POLO' : 'NOVO POLO',
    tableName: 'polos',
    details: `${id ? 'Editou' : 'Cadastrou'} o polo: ${nome} (${tipo})`
  })

  for (const modulo of ['ebd', 'ibv', 'ibuc']) {
    revalidatePath(`/aplicacao/${modulo}/admin/polos`)
  }
}