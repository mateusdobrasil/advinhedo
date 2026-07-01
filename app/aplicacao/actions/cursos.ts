'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function salvarCurso(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const id = formData.get('id') as string
  const nome = formData.get('nome') as string
  const status = formData.get('status') as string // Lendo a sua coluna existente

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  // 1. Salva ou Atualiza o Curso
  const { error } = await supabase
    .from('ibv_cursos')
    .upsert({
      ...(id ? { id } : {}),
      nome,
      descricao: formData.get('descricao'),
      duracao: formData.get('duracao'),
      // Se tiver valor, transforma em número. Se estiver vazio, manda null (nulo).
      valor_mensalidade: formData.get('valor_mensalidade') ? Number(formData.get('valor_mensalidade')) : null,
      status: status
    })

  if (error) throw new Error(error.message)

  // 2. Registro na Auditoria com a função centralizada
  await logAction(supabase, session.user, {
    action: id ? 'EDIÇÃO DE CURSO' : 'NOVO CURSO',
    tableName: 'ibv_cursos',
    details: `${id ? 'Alterou' : 'Cadastrou'} o curso ${nome} com status: ${status.toUpperCase()}`
  })

  revalidatePath('/aplicacao/ibv/admin/cursos')
}