"use server";

import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server";

/** Encerra a sessão do painel e volta para o login. */
export async function signOutAction() {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/backstage-ft/login");
}
