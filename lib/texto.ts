// Padroniza campos de nome/identificação em maiúsculo antes de gravar no banco.
// Não usar em e-mail, senha, IDs, datas ou textos livres longos (descrição/observação).
export function paraMaiusculo(valor: FormDataEntryValue | string | null | undefined): string {
  if (!valor || typeof valor !== 'string') return ''
  return valor.toUpperCase()
}
