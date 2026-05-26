'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function salvarMateria(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const id = formData.get('id') as string
  const nome = formData.get('nome') as string
  const curso_id = formData.get('curso_id') as string
  const status = formData.get('status') as string // Captura o novo status

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const { error } = await supabase
    .from('materias')
    .upsert({
      ...(id ? { id } : {}),
      nome,
      curso_id,
      status // Salva na coluna status
    })

  if (error) throw new Error(error.message)

  // Registro na Auditoria
  const { data: admin } = await supabase.from('perfis').select('nome_completo').eq('id', session.user.id).single()
  await supabase.from('auditoria').insert({
    usuario_id: session.user.id,
    usuario_nome: admin?.nome_completo || 'Sistema',
    acao: id ? 'EDIÇÃO DE MATÉRIA' : 'NOVA MATÉRIA',
    tabela_afetada: 'materias',
    detalhes: `${id ? 'Alterou' : 'Cadastrou'} a matéria ${nome} como ${status.toUpperCase()}`
  })

  revalidatePath('/ibv/admin/materias')
}