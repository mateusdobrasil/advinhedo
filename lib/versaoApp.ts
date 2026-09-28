// Identifica a versão do app atualmente rodando no servidor. Tanto o Render
// (RENDER_GIT_COMMIT) quanto a Vercel (VERCEL_GIT_COMMIT_SHA) definem
// automaticamente o SHA do commit em todo deploy, então usamos isso como
// "versão" — muda a cada deploy sem precisar bump manual.
export function obterVersaoApp(): string {
  return (
    process.env.RENDER_GIT_COMMIT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.npm_package_version ||
    'dev'
  )
}
