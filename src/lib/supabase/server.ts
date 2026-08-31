import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Clientes Supabase para uso NO SERVIDOR (Server Components, Server Actions,
 * Route Handlers, proxy). O `import "server-only"` faz o build FALHAR se este
 * módulo vazar para um Client Component.
 *
 * Duas responsabilidades bem distintas:
 *
 *  1. createServerAuthClient()  -> sessão do usuário autenticado + RLS.
 *     É o cliente do PAINEL. Nunca ignora RLS. Lê/grava cookies de auth.
 *
 *  2. createAdminClient()       -> chave service_role, IGNORA o RLS.
 *     Exclusivo do fluxo público /assistir/[slug] (busca por slug secreto).
 *     Não deve ser usado pelo painel.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Cliente ligado à sessão do usuário (cookies). Respeita RLS. */
export async function createServerAuthClient(): Promise<SupabaseClient> {
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (veja .env.local.example).",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado durante o render de um Server Component, onde não é
          // possível gravar cookies. Sem problema: o proxy (src/proxy.ts)
          // renova a sessão a cada request do /backstage-ft.
        }
      },
    },
  });
}

/** Cliente com service_role. IGNORA o RLS. Só para o fluxo público por slug. */
export function createAdminClient(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "SUPABASE_SERVICE_ROLE_KEY em .env.local (veja .env.local.example).",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
