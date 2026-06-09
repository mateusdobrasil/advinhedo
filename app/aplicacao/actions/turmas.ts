'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function criarTurma(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // 1. Verificação de Segurança
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  // 2. Captura os dados básicos do formulário
  const nome = formData.get('nome') as string
  const curso = formData.get('curso') as string
  const modalidade = formData.get('modalidade') as string
  const dia_semana = formData.get('dia_semana') as string
  const horario = formData.get('horario') as string
  
  // 3. Captura os novos campos da Escola Bíblica Dominical (EBD)
  // O checkbox envia 'on' quando marcado. Convertendo isso para true/false.
  const is_ebd = formData.get('is_ebd') === 'on' || formData.get('is_ebd') === 'true'
  const faixa_etaria = formData.get('faixa_etaria') as string || null

  // 4. Verifica se é Criação ou Edição
  const id = formData.get('id') as string 
  const status = formData.get('status') as string || 'Ativa'

  if (id) {
    // ==========================================
    // MODO EDIÇÃO
    // ==========================================
    const { error } = await supabase
      .from('turmas')
      .update({ 
        nome, 
        curso, 
        modalidade, 
        dia_semana, 
        horario, 
        is_ebd, 
        faixa_etaria, 
        status 
      })
      .eq('id', id)
      
    if (error) {
      console.error("Erro ao atualizar turma:", error.message)
      throw new Error('Erro ao atualizar turma. Verifique os dados e tente novamente.')
    }
    
  } else {
    // ==========================================
    // MODO CRIAÇÃO (NOVA TURMA)
    // ==========================================
    const { error } = await supabase
      .from('turmas')
      .insert({ 
        nome, 
        curso, 
        modalidade, 
        dia_semana, 
        horario, 
        is_ebd, 
        faixa_etaria, 
        status: 'Ativa' // Toda turma nova nasce como Ativa por padrão
      })

    if (error) {
      console.error("Erro ao criar turma:", error.message)
      throw new Error('Erro ao criar turma. Verifique os dados e tente novamente.')
    }
  }

  // 5. Atualiza o cache da página para mostrar a nova turma instantaneamente
  revalidatePath('/aplicacao/ibv/admin/turmas')
}