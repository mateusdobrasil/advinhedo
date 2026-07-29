'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { logAction } from '@/lib/audit'
import { exigirAdministrador } from '@/lib/auth-admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function salvarPaginasDoCargo(modulo: string, nivelAcesso: string, paginasChaves: string[]) {
  const supabase = createServerActionClient({ cookies })
  const session = await exigirAdministrador(supabase)

  if (nivelAcesso.toLowerCase() === 'administrador') {
    throw new Error('O cargo Administrador já tem acesso total e não pode ser alterado.')
  }

  const { error: erroDelete } = await supabase
    .from('permissoes_paginas')
    .delete()
    .eq('modulo', modulo)
    .eq('nivel_acesso', nivelAcesso)

  if (erroDelete) throw new Error(`Erro ao salvar permissões: ${erroDelete.message}`)

  if (paginasChaves.length > 0) {
    const linhas = paginasChaves.map((chave) => ({ modulo, pagina_chave: chave, nivel_acesso: nivelAcesso }))
    const { error: erroInsert } = await supabase.from('permissoes_paginas').insert(linhas)
    if (erroInsert) throw new Error(`Erro ao salvar permissões: ${erroInsert.message}`)
  }

  await logAction(supabase, session.user, {
    action: 'ATUALIZAÇÃO DE PERMISSÕES DE PÁGINA',
    tableName: 'permissoes_paginas',
    details: `Definiu as páginas do cargo "${nivelAcesso}" (${modulo}): ${paginasChaves.join(', ') || 'nenhuma'}.`
  })

  revalidatePath(`/aplicacao/${modulo}/admin/niveis-acesso`)
  revalidatePath(`/aplicacao/${modulo}/admin`)
}
