'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function salvarPolo(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const id = formData.get('id') as string // Se houver ID, é edição
  const nome = formData.get('nome') as string
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

  // 2. Registro na Auditoria
  const { data: admin } = await supabase
    .from('perfis')
    .select('nome_completo')
    .eq('id', session.user.id)
    .single()

  await supabase.from('auditoria').insert({
    usuario_id: session.user.id,
    usuario_nome: admin?.nome_completo || 'Sistema',
    acao: id ? 'EDIÇÃO DE POLO' : 'NOVO POLO',
    tabela_afetada: 'polos',
    detalhes: `${id ? 'Editou' : 'Cadastrou'} o polo: ${nome} (${tipo})`
  })

  revalidatePath('/ibv/admin/polos')
}