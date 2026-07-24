// PostgREST interpreta vírgula, parênteses e ponto como sintaxe de filtro dentro de .or()/.in().
// Sem isso, um termo de busca como "x,tipo_usuario.neq." poderia alterar a cláusula gerada
// em vez de ser tratado como texto literal.
export function sanitizarFiltroBusca(valor: string) {
  return valor.replace(/[,()."]/g, '')
}
