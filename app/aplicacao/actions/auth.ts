'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function realizarLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const poloDestino = formData.get('polo_destino') as string

  const supabase = createServerActionClient({ cookies })

  // 1. Valida Email e Senha no Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { erro: 'E-mail ou senha incorretos.' }
  }

  // 2. Busca os dados de Perfil (Para checar permissões e polos vinculados)
  const userId = authData.user.id
  const { data: perfil, error: perfilError } = await supabase
    .from('perfis')
    .select('tipo_usuario, polo')
    .eq('id', userId)
    .single()

  if (perfilError || !perfil) {
    return { erro: 'Perfil não encontrado no sistema.' }
  }

  // 3. Valida se o usuário tem vínculo com o Polo selecionado
  // Verifica se o texto do banco contém a sigla selecionada no formulário (ex: "IBV", "EBD")
  const polosDoUsuario = (perfil.polo || '').toUpperCase()
  if (!polosDoUsuario.includes(poloDestino.toUpperCase())) {
    // Desloga o usuário imediatamente caso ele não tenha acesso a este polo
    await supabase.auth.signOut() 
    return { erro: `Você não possui permissão de acesso ao polo ${poloDestino}.` }
  }

  // 4. Monta a rota de destino baseada no Polo e Nível de Acesso
  let urlDestino = ''

  const tipoUsuario = (perfil.tipo_usuario || '').toLowerCase()
  const ehAdminOuProfessor = tipoUsuario.includes('administrador') || 
                             tipoUsuario.includes('administrativo') || 
                             tipoUsuario.includes('professor')

  // Estrutura de roteamento dinâmica
  if (poloDestino === 'EBD') {
    urlDestino = ehAdminOuProfessor ? '/aplicacao/ebd' : '/aplicacao/ebd'
  } 
  else if (poloDestino === 'IBUC') {
    urlDestino = ehAdminOuProfessor ? '/aplicacao/ibuc' : '/aplicacao/ibuc'
  } 
  else {
    // Padrão IBV
    urlDestino = ehAdminOuProfessor ? '/aplicacao/ibv' : '/aplicacao/ibv'
  }

  // 5. Redireciona o usuário para o hub correto
  redirect(urlDestino)
}