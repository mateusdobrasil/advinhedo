"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function salvarConteudo(dados: { igreja: unknown; conteudo: unknown }) {
  const { error } = await supabase
    .from("site_conteudo")
    .update({ dados, atualizado_em: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/");
  revalidatePath("/igreja");
  revalidatePath("/contato");
  return { ok: true };
}

export async function carregarConteudo() {
  const { data } = await supabase
    .from("site_conteudo")
    .select("dados")
    .eq("id", 1)
    .single();
  return data?.dados ?? null;
}