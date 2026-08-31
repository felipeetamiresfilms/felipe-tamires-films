import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (o antigo "middleware", renomeado no Next.js 16).
 *
 * Roda SÓ em /backstage-ft/* (ver `config.matcher`). Duas funções:
 *   1. renovar os cookies da sessão do Supabase a cada request;
 *   2. redirect otimista para /backstage-ft/login quando não há sessão.
 *
 * NÃO é a autorização final: quem confirma o usuário (getUser) e o vínculo
 * com admin_users é o layout de `(protected)`. Aqui é só uma checagem rápida.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem configuração do Supabase, o proxy não intervém.
  if (!supabaseUrl || !anonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute =
    pathname === "/backstage-ft/login" ||
    pathname.startsWith("/backstage-ft/login/");

  if (!user && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/backstage-ft/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/backstage-ft", "/backstage-ft/:path*"],
};
