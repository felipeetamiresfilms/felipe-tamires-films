import "server-only";

import { createServerAuthClient } from "@/lib/supabase/server";

/**
 * Verificação de acesso ao painel.
 *
 *  - "anon"      -> ninguém autenticado (redirecionar para /backstage-ft/login)
 *  - "forbidden" -> autenticado, mas fora de admin_users (negar acesso)
 *  - "ok"        -> administrador liberado
 *
 * Usa `auth.getUser()` (revalida o JWT no servidor do Supabase), nunca só o
 * conteúdo do cookie de sessão.
 */
export type BackstageAccess =
  | { state: "anon" }
  | { state: "forbidden" }
  | { state: "ok"; userId: string; email: string; displayName: string };

export async function loadBackstageAccess(): Promise<BackstageAccess> {
  const supabase = await createServerAuthClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { state: "anon" };
  }

  // RLS permite ao admin ler apenas a própria linha de admin_users.
  // Sem linha => não é administrador.
  const { data: admin } = await supabase
    .from("admin_users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle<{ display_name: string }>();

  if (!admin) {
    return { state: "forbidden" };
  }

  return {
    state: "ok",
    userId: user.id,
    email: user.email ?? "",
    displayName: admin.display_name,
  };
}
