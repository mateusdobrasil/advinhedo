/**
 * app/aplicacao/reunioes/admin/secretaria/layout.jsx
 *
 * Layout de SERVIDOR que protege TODAS as rotas dentro de secretaria/.
 * Roda no servidor antes de renderizar qualquer página filha:
 * - Se há sessão válida → renderiza a página normalmente
 * - Se não há → mostra a tela de senha (client component)
 *
 * Como é server component, a verificação acontece antes de qualquer
 * conteúdo protegido chegar ao navegador. Alguém que digite o link
 * direto de /secretaria/dashboard cai aqui e vê a tela de senha.
 *
 * OBS: isto protege a NAVEGAÇÃO. A proteção dos DADOS continua sendo
 * o RLS + as server actions (que exigem verificarAuthReuniao). As duas
 * camadas se somam.
 */

import { verificarAuthSecretaria } from '@/app/aplicacao/actions/secretaria-auth'
import SecretariaLogin from './_login'

export default async function SecretariaLayout({ children }) {
  const autenticado = await verificarAuthSecretaria()

  if (!autenticado) {
    return <SecretariaLogin />
  }

  return children
}