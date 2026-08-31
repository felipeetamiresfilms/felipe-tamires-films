"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para o BROWSER (Client Components do painel).
 *
 * Usa só a chave `anon` (`NEXT_PUBLIC_*`) e respeita o RLS. Compartilha os
 * cookies de sessão com o servidor via `@supabase/ssr`.
 *
 * A chave `service_role` NUNCA passa por aqui — ela vive só em
 * `src/lib/supabase/server.ts` (server-only).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local.",
    );
  }

  return createBrowserClient(supabaseUrl, anonKey);
}
