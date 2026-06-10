// app/actions/site-conteudo.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function salvarConteudo(dados: { igreja: unknown; conteudo: unknown }) {
  const supabase = createServerActionClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Não autenticado" };

  const { error } = await supabase
    .from("site_conteudo")
    .update({ dados, atualizado_em: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function carregarConteudo() {
  const supabase = createServerActionClient({ cookies });
  const { data } = await supabase
    .from("site_conteudo")
    .select("dados")
    .eq("id", 1)
    .single();
  return data?.dados ?? null;
}