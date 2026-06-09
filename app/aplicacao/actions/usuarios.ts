'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js' // 👈 Importação necessária para o Cliente Isolado
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Função auxiliar para evitar enviar strings vazias pro banco
const limparTexto = (texto: FormDataEntryValue | null) => {
  if (!texto || typeof texto !== 'string' || texto.trim() === '') return null
  return texto
}

// ============================================================================
// BLOCO 1: CRIAR NOVO USUÁRIO (CriadorUsuario)
// ============================================================================
export async function criarUsuario(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Extraindo os dados do formulário
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string
  const nome_completo = formData.get('nome_completo') as string
  
  const cpf = limparTexto(formData.get('cpf'))
  const polo_id = limparTexto(formData.get('polo_id'))
  const polo = limparTexto(formData.get('polo'))

  // 1. Verificação de Segurança
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  // 👇 O SEGREDO PARA NÃO DESLOGAR O ADMIN 👇
  // Instanciamos um cliente do Supabase "isolado" que não injeta cookies.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabaseIsolado = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false } // Impede o auto-login
  })

  // 2. Criação do Usuário na Autenticação usando o cliente isolado
  const { data: authData, error: authError } = await supabaseIsolado.auth.signUp({
    email,
    password: senha,
  })

  if (authError) throw new Error(`Erro na criação da conta: ${authError.message}`)

  const userId = authData.user?.id
  if (!userId) throw new Error('Falha ao obter o ID do usuário após o cadastro.')

  // 3. Salva TODOS os detalhes na tabela perfis (UPSERT)
  // Voltamos a usar o 'supabase' normal pois o admin tem as permissões RLS necessárias
  const { error: perfilError } = await supabase
    .from('perfis')
    .upsert({
      id: userId,
      tipo_usuario: 'ALUNO', // Fixo, pois removemos do form
      email: email,
      nome_completo: nome_completo,
      cpf: cpf,
      polo_id: polo_id,
      polo: polo
    })

  if (perfilError) {
    throw new Error(`Conta criada, mas houve um erro ao salvar o perfil: ${perfilError.message}`)
  }

  // 4. Auditoria
  const { data: admin } = await supabase.from('perfis').select('nome_completo').eq('id', session.user.id).single()
  await supabase.from('auditoria').insert({
    usuario_id: session.user.id,
    usuario_nome: admin?.nome_completo || 'Sistema',
    acao: 'NOVO CADASTRO MANUAL',
    tabela_afetada: 'perfis',
    detalhes: `Cadastrou o aluno: ${nome_completo} no polo ${polo}`
  })

  revalidatePath('/aplicacao/ibv/admin/cadastro')
}

// ============================================================================
// BLOCO 2: ATUALIZAR USUÁRIO (EditorCadastroCompleto)
// ============================================================================
export async function atualizarUsuario(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const id = formData.get('id') as string
  const dadosParaAtualizar: Record<string, any> = {}

  formData.forEach((value, key) => {
    if (key !== 'id' && !key.startsWith('$')) {
      if (key.includes('data') && value === '') {
        dadosParaAtualizar[key] = null
      } else {
        dadosParaAtualizar[key] = value
      }
    }
  })

  const { error } = await supabase
    .from('perfis')
    .update(dadosParaAtualizar)
    .eq('id', id)

  if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`)

  const { data: admin } = await supabase.from('perfis').select('nome_completo').eq('id', session.user.id).single()

  await supabase.from('auditoria').insert({
    usuario_id: session.user.id,
    usuario_nome: admin?.nome_completo || 'Sistema',
    acao: 'EDIÇÃO COMPLETA DE CADASTRO',
    tabela_afetada: 'perfis',
    detalhes: `Editou os dados completos de: ${dadosParaAtualizar.nome_completo}`
  })

  revalidatePath(`/aplicacao/ibv/admin/cadastro/${id}`)
  revalidatePath('/aplicacao/ibv/admin/cadastro')
}