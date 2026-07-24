'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function salvarMateria(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const id = formData.get('id') as string
  const nome = formData.get('nome') as string
  const curso_id = formData.get('curso_id') as string
  const status = formData.get('status') as string // Captura o novo status

  // A EBD tem tabela própria (ebd_materias); IBV/IBUC continuam na tabela genérica
  const modulo = formData.get('modulo') as string
  const tabela = modulo === 'ebd' ? 'ebd_materias' : 'materias'

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const { error } = await supabase
    .from(tabela)
    .upsert({
      ...(id ? { id } : {}),
      nome,
      curso_id,
      status // Salva na coluna status
    })

  if (error) throw new Error(error.message)

  // Registro na Auditoria com a função centralizada
  await logAction(supabase, session.user, {
    action: id ? 'EDIÇÃO DE MATÉRIA' : 'NOVA MATÉRIA',
    tableName: tabela,
    details: `${id ? 'Alterou' : 'Cadastrou'} a matéria ${nome} como ${status.toUpperCase()}`
  })

  revalidatePath(`/aplicacao/${modulo}/admin/materias`)
}