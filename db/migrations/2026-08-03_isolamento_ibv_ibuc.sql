-- ============================================================================
-- Isolamento dos módulos IBV e IBUC
-- Rode este script inteiro de uma vez no SQL Editor do Supabase (produção).
--
-- O que ele faz:
--   1) Corrige as foreign keys de ibv_turmas / ibv_matriculas / ibv_diario_classe /
--      ibv_materias, que hoje apontam por engano para as tabelas do EBD
--      (sinal de que ibv_* foi criada duplicando ebd_* sem repontar os relacionamentos).
--   2) Adiciona a coluna professor_id em ibv_turmas (não existe hoje, mas o
--      código sempre tenta gravar nela).
--   3) Cria o schema ibuc_* do zero, espelhando a estrutura corrigida do ibv_*,
--      já com as FKs corretas.
--   4) Remove a tabela ibv_notas (código morto — grava mas nunca é lido em
--      nenhuma tela; o boletim real usa ibv_diario_classe).
--
-- Confirmado antes de escrever este script (leitura via API do Supabase):
--   - ibv_* está com 0 linhas em todas as tabelas, ibuc_* não existe -> não há
--     dado real para migrar ou perder aqui.
--   - O bucket de Storage "ibuc_materiais" JÁ EXISTE (criado junto com
--     ibv_materiais/ebd_materiais) — não precisa ser criado por este script.
--   - EBD não é tocado por este script.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PARTE 1 — Corrigir as FKs erradas do IBV
-- ----------------------------------------------------------------------------
-- Função auxiliar temporária: localiza o nome real da constraint de FK
-- (não confiamos em nomes "padrão" adivinhados) e a recria apontando para o
-- alvo correto. É removida no final desta seção.

create or replace function public._tmp_fix_fk(
  p_table text,
  p_column text,
  p_target_table text,
  p_new_constraint_name text
) returns void as $$
declare
  v_constraint_name text;
begin
  select tc.constraint_name into v_constraint_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public'
    and tc.table_name = p_table
    and kcu.column_name = p_column;

  if v_constraint_name is not null then
    execute format('alter table public.%I drop constraint %I', p_table, v_constraint_name);
  end if;

  execute format(
    'alter table public.%I add constraint %I foreign key (%I) references public.%I(id)',
    p_table, p_new_constraint_name, p_column, p_target_table
  );
end;
$$ language plpgsql;

select public._tmp_fix_fk('ibv_turmas',        'curso_id',     'ibv_cursos',     'ibv_turmas_curso_id_fkey');
select public._tmp_fix_fk('ibv_matriculas',    'turma_id',     'ibv_turmas',     'ibv_matriculas_turma_id_fkey');
select public._tmp_fix_fk('ibv_diario_classe', 'turma_id',     'ibv_turmas',     'ibv_diario_classe_turma_id_fkey');
select public._tmp_fix_fk('ibv_diario_classe', 'matricula_id', 'ibv_matriculas','ibv_diario_classe_matricula_id_fkey');
select public._tmp_fix_fk('ibv_materias',      'curso_id',     'ibv_cursos',     'ibv_materias_curso_id_fkey');

drop function public._tmp_fix_fk(text, text, text, text);


-- ----------------------------------------------------------------------------
-- PARTE 2 — Adicionar professor_id em ibv_turmas
-- ----------------------------------------------------------------------------
alter table public.ibv_turmas
  add column if not exists professor_id uuid references public.perfis(id);


-- ----------------------------------------------------------------------------
-- PARTE 3 — Criar o schema ibuc_* (espelho do ibv_* já corrigido)
-- ----------------------------------------------------------------------------

create table public.ibuc_cursos (
  id uuid primary key default gen_random_uuid(),
  nome text,
  descricao text,
  duracao text,
  carga_horaria_total integer,
  valor_mensalidade numeric,
  status text,
  created_at timestamptz not null default now()
);

create table public.ibuc_turmas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid references public.ibuc_cursos(id),
  polo_id uuid references public.polos(id),
  professor_id uuid references public.perfis(id),
  semestre text,
  data_inicio date,
  curso text,
  modalidade text,
  dia_semana text,
  horario text,
  status text,
  nome text,
  is_ebd boolean not null default false,
  faixa_etaria text,
  created_at timestamptz not null default now()
);

create table public.ibuc_matriculas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid references public.perfis(id),
  turma_id uuid references public.ibuc_turmas(id),
  status text,
  data_matricula date,
  revista_entregue boolean not null default false,
  created_at timestamptz not null default now()
);

-- Mesma estrutura de ibv_financeiro/ebd_financeiro (cobranças avulsas por aluno).
create table public.ibuc_financeiro (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid references public.perfis(id),
  descricao text,
  valor numeric,
  data_vencimento date,
  data_pagamento date,
  status text,
  link_pagamento text
);

create table public.ibuc_materiais (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  descricao text,
  arquivo_url text,
  created_at timestamptz not null default now()
);

create table public.ibuc_materias (
  id uuid primary key default gen_random_uuid(),
  nome text,
  descricao text,
  curso_id uuid references public.ibuc_cursos(id),
  carga_horaria text,
  status text,
  created_at timestamptz not null default now()
);

create table public.ibuc_diario_classe (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid references public.ibuc_matriculas(id),
  disciplina_id uuid references public.disciplinas(id),
  aluno_id uuid references public.perfis(id),
  turma_id uuid references public.ibuc_turmas(id),
  materia_id uuid references public.ibuc_materias(id),
  nota numeric,
  frequencia_percentual integer,
  aprovado boolean,
  faltas integer,
  observacao text,
  data_fechamento date,
  created_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- PARTE 4 — Remover ibv_notas (código morto)
-- Só rode esta parte depois que o deploy do código (sem mais nenhuma
-- referência a ibv_notas / lancarNota / LancadorNota) já estiver no ar.
-- ----------------------------------------------------------------------------
drop table if exists public.ibv_notas;
