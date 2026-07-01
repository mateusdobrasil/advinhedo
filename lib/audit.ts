import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Define o formato esperado para um registro de auditoria.
 */
type AuditLog = {
  action: string;
  tableName: string;
  details: string;
};

/**
 * Função auxiliar para registrar uma ação na tabela 'auditoria'.
 * @param supabase - A instância do cliente Supabase.
 * @param user - O objeto do usuário que está realizando a ação.
 * @param log - Os detalhes da ação a ser registrada.
 */
export async function logAction(supabase: SupabaseClient, user: User, log: AuditLog) {
  // Busca o nome completo do usuário que está realizando a ação a partir da tabela 'perfis'.
  const { data: admin } = await supabase.from('perfis').select('nome_completo').eq('id', user.id).single();

  // Insere o registro de auditoria no banco de dados.
  await supabase.from('auditoria').insert({
    usuario_id: user.id,
    usuario_nome: admin?.nome_completo || user.email || 'Sistema', // Fallback para email se o nome não existir
    acao: log.action,
    tabela_afetada: log.tableName,
    detalhes: log.details,
  });
}