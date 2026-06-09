import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 1. Atualiza a sessão Supabase
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const path = url.pathname

  // 2. Proteção das rotas /reunioes/admin via cookie de senha
  if (path.startsWith('/aplicacao/reunioes/admin')) {
    const auth = req.cookies.get('reunioes_auth')?.value
    if (auth !== 'true') {
      url.pathname = '/aplicacao/reunioes'
      return NextResponse.redirect(url)
    }
  }

  // 3. Proteção das rotas /recepcao via cookie de senha
  //    Exclui /recepcao/login para não criar loop de redirecionamento
  if (path.startsWith('/aplicacao/recepcao') && path !== '/aplicacao/recepcao/login') {
    const auth = req.cookies.get('recepcao_auth')?.value
    if (auth !== 'true') {
      url.pathname = '/aplicacao/recepcao/login'
      return NextResponse.redirect(url)
    }
  }

  // 4. Proteção do IBV: sem sessão Supabase → vai para Home
  if (!session && path.startsWith('/aplicacao/ibv')) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 5. Já logado no Supabase e tenta ir para Home → vai para IBV
  if (session && path === '/') {
    url.pathname = '/aplicacao/ibv'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}