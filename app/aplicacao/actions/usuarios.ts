'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js' // 👈 Importação necessária para o Cliente Isolado
import { logAction } from '@/lib/audit'
import { paraMaiusculo } from '@/lib/texto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ehAdministrador, usuarioTemAcessoPagina } from '@/lib/permissoes'

const MODULOS = ['ebd', 'ibv', 'ibuc'] as const

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
  const nome_completo = paraMaiusculo(formData.get('nome_completo'))

  const cpf = limparTexto(formData.get('cpf'))
  const polo_id = limparTexto(formData.get('polo_id'))
  const poloTexto = limparTexto(formData.get('polo'))
  const polo = poloTexto ? paraMaiusculo(poloTexto) : null

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

  // 4. Auditoria com a função centralizada
  await logAction(supabase, session.user, {
    action: 'NOVO CADASTRO MANUAL',
    tableName: 'perfis',
    details: `Cadastrou o aluno: ${nome_completo} no polo ${polo}`
  })

  for (const modulo of ['ebd', 'ibv', 'ibuc']) {
    revalidatePath(`/aplicacao/${modulo}/admin/cadastro`)
  }
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
      } else if (key === 'nome_completo') {
        dadosParaAtualizar[key] = paraMaiusculo(value)
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

  await logAction(supabase, session.user, {
    action: 'EDIÇÃO COMPLETA DE CADASTRO',
    tableName: 'perfis',
    details: `Editou os dados completos de: ${dadosParaAtualizar.nome_completo}`
  })

  for (const modulo of ['ebd', 'ibv', 'ibuc']) {
    revalidatePath(`/aplicacao/${modulo}/admin/cadastro/${id}`)
    revalidatePath(`/aplicacao/${modulo}/admin/cadastro`)
  }
}

// ============================================================================
// BLOCO 3: DESATIVAR / REATIVAR ALUNO (BotaoStatusAluno)
// ============================================================================
// Ao desativar (ex: cadastro duplicado), cancela em cascata qualquer matrícula
// ativa da pessoa nos 3 módulos (ebd/ibv/turmas = "sala"; a matéria em si é
// vinculada à turma, não existe matrícula por matéria separada). Reativar só
// devolve o acesso da pessoa — não recria matrículas antigas automaticamente,
// isso é uma decisão manual do admin.
export async function alterarStatusAluno(
  id: string,
  novoStatus: 'Ativo' | 'Inativo'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: 'Não autorizado.' }

    const { data: adminLogado } = await supabase
      .from('perfis')
      .select('tipo_usuario')
      .eq('id', session.user.id)
      .single()

    const podeAlterar =
      ehAdministrador(adminLogado?.tipo_usuario) ||
      (await Promise.all(
        MODULOS.map((modulo) => usuarioTemAcessoPagina(supabase, adminLogado?.tipo_usuario, modulo, 'cadastro'))
      )).some(Boolean)

    if (!podeAlterar) {
      return { ok: false, error: 'Acesso negado: você não tem permissão para desativar/reativar cadastros.' }
    }

    const { data: alunoAlvo } = await supabase
      .from('perfis')
      .select('nome_completo')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('perfis')
      .update({ status: novoStatus })
      .eq('id', id)

    if (error) {
      console.error('ERRO AO ALTERAR STATUS DO ALUNO:', error)
      return { ok: false, error: `Erro ao atualizar status: ${error.message}` }
    }

    // Ao desativar, cancela a matrícula em qualquer sala/turma dos 3 módulos
    if (novoStatus === 'Inativo') {
      for (const modulo of MODULOS) {
        const { error: erroMatricula } = await supabase
          .from(`${modulo}_matriculas`)
          .update({ status: 'Cancelada' })
          .eq('aluno_id', id)
          .neq('status', 'Cancelada')

        if (erroMatricula) {
          console.error(`ERRO AO CANCELAR MATRÍCULAS (${modulo}) do aluno ${id}:`, erroMatricula)
        }
      }
    }

    await logAction(supabase, session.user, {
      action: novoStatus === 'Inativo' ? 'DESATIVAÇÃO DE CADASTRO' : 'REATIVAÇÃO DE CADASTRO',
      tableName: 'perfis',
      details: `${novoStatus === 'Inativo' ? 'Desativou' : 'Reativou'} o cadastro de ${alunoAlvo?.nome_completo || id}${novoStatus === 'Inativo' ? ' e cancelou suas matrículas ativas' : ''}.`
    })

    for (const modulo of MODULOS) {
      revalidatePath(`/aplicacao/${modulo}/admin/cadastro/${id}`)
      revalidatePath(`/aplicacao/${modulo}/admin/cadastro`)
      revalidatePath(`/aplicacao/${modulo}/admin/matriculas`)
      revalidatePath(`/aplicacao/${modulo}/admin/turmas`)
    }

    return { ok: true }
  } catch (erroInesperado: any) {
    console.error('ERRO INESPERADO EM alterarStatusAluno:', erroInesperado)
    return { ok: false, error: erroInesperado?.message || 'Erro inesperado ao atualizar status.' }
  }
}