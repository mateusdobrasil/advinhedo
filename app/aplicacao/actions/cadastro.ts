'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Função auxiliar para lidar com datas vazias do formulário
const limparData = (dataStr: FormDataEntryValue | null) => {
  if (!dataStr || typeof dataStr !== 'string' || dataStr.trim() === '') return null
  return dataStr
}

// Função auxiliar para transformar strings vazias em nulos (bom para o banco)
const limparTexto = (texto: FormDataEntryValue | null) => {
  if (!texto || typeof texto !== 'string' || texto.trim() === '') return null
  return texto
}

export async function cadastrarAluno(formData: FormData) {
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string
  const nome = formData.get('nome') as string

  const supabase = createServerActionClient({ cookies })

  // 1. Cria o usuário no Autenticador do Supabase (A porta de entrada)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
  })

  // Se der erro de email já existente ou senha fraca
  if (authError) {
    throw new Error(`Erro na criação da conta: ${authError.message}`)
  }

  const userId = authData.user?.id
  if (!userId) {
    throw new Error('Falha ao obter o ID do usuário após o cadastro.')
  }

  // 2. Salva TODOS os detalhes na tabela perfis (UPSERT)
  const { error: perfilError } = await supabase
    .from('perfis')
    .upsert({
      id: userId,
      tipo_usuario: 'Aluno', // Padronizado conforme a sua tabela
      
      // 👇 AS DUAS COLUNAS REFERENTES AO POLO 👇
      polo_id: limparTexto(formData.get('polo_id')), // ID do Polo (UUID)
      polo: limparTexto(formData.get('polo')),       // Nome do Polo em texto que injetamos no form
      
      email: email,
      nome_completo: nome,
      
      // Dados Pessoais
      telefone: limparTexto(formData.get('telefone')), 
      data_nascimento: limparData(formData.get('data_nascimento')),
      sexo: limparTexto(formData.get('sexo')),
      estado_civil: limparTexto(formData.get('estado_civil')),
      cpf: limparTexto(formData.get('cpf')),
      rg: limparTexto(formData.get('rg')),
      nacionalidade: limparTexto(formData.get('nacionalidade')),
      cidade_nascimento: limparTexto(formData.get('cidade_nascimento')),
      estado_nascimento: limparTexto(formData.get('estado_nascimento')),
      profissao: limparTexto(formData.get('profissao')),
      
      // Endereço
      endereco: limparTexto(formData.get('endereco')),
      complemento: limparTexto(formData.get('complemento')),
      bairro: limparTexto(formData.get('bairro')),
      cidade: limparTexto(formData.get('cidade')),
      estado: limparTexto(formData.get('estado')), 
      cep: limparTexto(formData.get('cep')),
      
      // Formação Escolar e Teológica
      escolaridade: limparTexto(formData.get('escolaridade')),
      qual_curso: limparTexto(formData.get('qual_curso')),
      possui_teologia: limparTexto(formData.get('possui_teologia')),
      qual_teologia: limparTexto(formData.get('qual_teologia')),
      onde_teologia: limparTexto(formData.get('onde_teologia')),
      
      // Histórico Eclesiástico
      igreja: limparTexto(formData.get('igreja')),
      local_igreja: limparTexto(formData.get('local_igreja')),
      pastor: limparTexto(formData.get('pastor')),
      departamento: limparTexto(formData.get('departamento')),
      possui_cargo: limparTexto(formData.get('possui_cargo')),
      qual_cargo: limparTexto(formData.get('qual_cargo')),
      
      data_conversao: limparData(formData.get('data_conversao')),
      data_batismo: limparData(formData.get('data_batismo')),
    })

  // Bloco de erro único e com mensagem detalhada
  if (perfilError) {
    console.error("Erro ao salvar detalhes do perfil:", perfilError.message)
    throw new Error(`Conta criada, mas houve um erro ao salvar os detalhes: ${perfilError.message}`)
  }

  // Gravação na tabela de Auditoria
  const { error: auditError } = await supabase.from('auditoria').insert({
    usuario_id: userId, 
    usuario_nome: nome, 
    acao: 'NOVO CADASTRO',
    tabela_afetada: 'perfis',
    detalhes: `O aluno ${nome} realizou o auto-cadastro pelo portal público.`
  })

  if (auditError) console.error("❌ ERRO AO GRAVAR AUDITORIA:", auditError.message)
}