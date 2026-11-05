import { SupabaseClient } from '@supabase/supabase-js'

export interface PaginaDef {
  chave: string
  nome: string
  rota: string
}

// Catálogo das páginas administrativas do EBD. Cada `chave` é o identificador
// usado na tabela `permissoes_paginas` (coluna pagina_chave).
export const PAGINAS_EBD: PaginaDef[] = [
  { chave: 'cadastro', nome: 'Cadastro Central', rota: '/aplicacao/ebd/admin/cadastro' },
  { chave: 'alunos', nome: 'Alunos', rota: '/aplicacao/ebd/admin/alunos' },
  { chave: 'matriculas', nome: 'Matrículas', rota: '/aplicacao/ebd/admin/matriculas' },
  { chave: 'turmas', nome: 'Turmas', rota: '/aplicacao/ebd/admin/turmas' },
  { chave: 'cursos', nome: 'Cursos', rota: '/aplicacao/ebd/admin/cursos' },
  { chave: 'ebd', nome: 'Salas da EBD', rota: '/aplicacao/ebd/admin/ebd' },
  { chave: 'financeiro', nome: 'Financeiro', rota: '/aplicacao/ebd/admin/financeiro' },
  { chave: 'materiais', nome: 'Materiais', rota: '/aplicacao/ebd/admin/materiais' },
  { chave: 'avisos', nome: 'Avisos', rota: '/aplicacao/ebd/admin/avisos' },
  { chave: 'polos', nome: 'Polos', rota: '/aplicacao/ebd/admin/polos' },
  { chave: 'permissoes', nome: 'Permissões', rota: '/aplicacao/ebd/admin/permissoes' },
  { chave: 'niveis-acesso', nome: 'Níveis de Acesso', rota: '/aplicacao/ebd/admin/niveis-acesso' },
  { chave: 'auditoria', nome: 'Auditoria', rota: '/aplicacao/ebd/admin/auditoria' },
  { chave: 'relatorios', nome: 'Relatórios', rota: '/aplicacao/ebd/admin/relatorios' },
  { chave: 'relatoriosEBD', nome: 'Relatórios da EBD', rota: '/aplicacao/ebd/admin/relatoriosEBD' },
  { chave: 'frequencia-alunos', nome: 'Frequência dos Alunos', rota: '/aplicacao/ebd/admin/frequencia-alunos' },
]

// Catálogo das páginas administrativas do IBV.
export const PAGINAS_IBV: PaginaDef[] = [
  { chave: 'cadastro', nome: 'Cadastro Central', rota: '/aplicacao/ibv/admin/cadastro' },
  { chave: 'alunos', nome: 'Alunos', rota: '/aplicacao/ibv/admin/alunos' },
  { chave: 'diario', nome: 'Diário de Classe', rota: '/aplicacao/ibv/admin/diario' },
  { chave: 'avisos', nome: 'Mural de Avisos', rota: '/aplicacao/ibv/admin/avisos' },
  { chave: 'turmas', nome: 'Turmas', rota: '/aplicacao/ibv/admin/turmas' },
  { chave: 'matriculas', nome: 'Matrículas', rota: '/aplicacao/ibv/admin/matriculas' },
  { chave: 'cursos', nome: 'Cursos', rota: '/aplicacao/ibv/admin/cursos' },
  { chave: 'materias', nome: 'Matérias', rota: '/aplicacao/ibv/admin/materias' },
  { chave: 'materiais', nome: 'Materiais', rota: '/aplicacao/ibv/admin/materiais' },
  { chave: 'relatorios', nome: 'Relatórios', rota: '/aplicacao/ibv/admin/relatorios' },
  { chave: 'financeiro', nome: 'Financeiro', rota: '/aplicacao/ibv/admin/financeiro' },
  { chave: 'polos', nome: 'Polos', rota: '/aplicacao/ibv/admin/polos' },
  { chave: 'permissoes', nome: 'Permissões', rota: '/aplicacao/ibv/admin/permissoes' },
  { chave: 'niveis-acesso', nome: 'Níveis de Acesso', rota: '/aplicacao/ibv/admin/niveis-acesso' },
  { chave: 'auditoria', nome: 'Auditoria', rota: '/aplicacao/ibv/admin/auditoria' },
]

// Catálogo das páginas administrativas do IBUC.
export const PAGINAS_IBUC: PaginaDef[] = [
  { chave: 'cadastro', nome: 'Cadastro Central', rota: '/aplicacao/ibuc/admin/cadastro' },
  { chave: 'alunos', nome: 'Alunos', rota: '/aplicacao/ibuc/admin/alunos' },
  { chave: 'diario', nome: 'Diário de Classe', rota: '/aplicacao/ibuc/admin/diario' },
  { chave: 'avisos', nome: 'Mural de Avisos', rota: '/aplicacao/ibuc/admin/avisos' },
  { chave: 'turmas', nome: 'Turmas', rota: '/aplicacao/ibuc/admin/turmas' },
  { chave: 'matriculas', nome: 'Matrículas', rota: '/aplicacao/ibuc/admin/matriculas' },
  { chave: 'cursos', nome: 'Cursos', rota: '/aplicacao/ibuc/admin/cursos' },
  { chave: 'materias', nome: 'Matérias', rota: '/aplicacao/ibuc/admin/materias' },
  { chave: 'materiais', nome: 'Materiais', rota: '/aplicacao/ibuc/admin/materiais' },
  { chave: 'relatorios', nome: 'Relatórios', rota: '/aplicacao/ibuc/admin/relatorios' },
  { chave: 'financeiro', nome: 'Financeiro', rota: '/aplicacao/ibuc/admin/financeiro' },
  { chave: 'polos', nome: 'Polos', rota: '/aplicacao/ibuc/admin/polos' },
  { chave: 'permissoes', nome: 'Permissões', rota: '/aplicacao/ibuc/admin/permissoes' },
  { chave: 'niveis-acesso', nome: 'Níveis de Acesso', rota: '/aplicacao/ibuc/admin/niveis-acesso' },
  { chave: 'auditoria', nome: 'Auditoria', rota: '/aplicacao/ibuc/admin/auditoria' },
]

function extrairCargos(tipoUsuario?: string | null): string[] {
  return (tipoUsuario || '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean)
}

// "Administrador" sempre tem acesso total e fixo — não depende da tabela
// permissoes_paginas, para nunca travar o próprio admin para fora das telas
// que configuram as permissões.
export function ehAdministrador(tipoUsuario?: string | null): boolean {
  return extrairCargos(tipoUsuario).includes('administrador')
}

export async function usuarioTemAcessoPagina(
  supabase: SupabaseClient,
  tipoUsuario: string | null | undefined,
  modulo: string,
  paginaChave: string
): Promise<boolean> {
  const cargos = extrairCargos(tipoUsuario)
  if (cargos.length === 0) return false
  if (cargos.includes('administrador')) return true

  const { data } = await supabase
    .from('permissoes_paginas')
    .select('nivel_acesso')
    .eq('modulo', modulo)
    .eq('pagina_chave', paginaChave)

  return (data || []).some((linha) => cargos.includes(linha.nivel_acesso.toLowerCase()))
}

export async function paginasPermitidas(
  supabase: SupabaseClient,
  tipoUsuario: string | null | undefined,
  modulo: string
): Promise<Set<string>> {
  const cargos = extrairCargos(tipoUsuario)
  if (cargos.length === 0) return new Set()

  const { data } = await supabase
    .from('permissoes_paginas')
    .select('pagina_chave, nivel_acesso')
    .eq('modulo', modulo)

  const chaves = new Set<string>()
  for (const linha of data || []) {
    if (cargos.includes(linha.nivel_acesso.toLowerCase())) chaves.add(linha.pagina_chave)
  }
  return chaves
}
