"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const fieldClass =
  "rounded-lg border border-hairline bg-surface px-4 py-3 text-bone outline-none transition-colors placeholder:text-bone-dim/60 focus:border-brass/60";
const labelClass =
  "flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-bone-dim";

/**
 * Chave única do e-mail administrativo lembrado (SÓ o e-mail — nunca senha,
 * token ou sessão). Centralizada aqui para não divergir.
 */
const REMEMBERED_EMAIL_KEY = "felipeTamiresBackstageEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- E-mail lembrado como "external store" ----------------------------------
// Ler localStorage direto no render quebraria a hidratação (server não tem
// window). `useSyncExternalStore` com snapshot de servidor `null` resolve isso
// sem `useEffect` + `setState` e sem flash grave.

function subscribeRememberedEmail(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getRememberedEmail(): string | null {
  try {
    const value = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    return value && EMAIL_RE.test(value) ? value : null;
  } catch {
    return null;
  }
}

function getRememberedEmailServer(): null {
  return null;
}

function persistRememberedEmail(remember: boolean, email: string) {
  try {
    if (remember && EMAIL_RE.test(email)) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch {
    // localStorage indisponível (modo privado etc.) — segue sem lembrar.
  }
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const storedEmail = useSyncExternalStore(
    subscribeRememberedEmail,
    getRememberedEmail,
    getRememberedEmailServer,
  );

  // `null` = ainda sem interação do usuário -> herda do e-mail salvo.
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [rememberOverride, setRememberOverride] = useState<boolean | null>(null);

  const emailValue = emailInput ?? storedEmail ?? "";
  const remember = rememberOverride ?? storedEmail !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    // Lembra (ou esquece) o e-mail assim que o login é submetido com um
    // e-mail válido — vale mesmo que a senha esteja errada.
    persistRememberedEmail(remember, email);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      setPending(false);
      return;
    }

    router.replace("/backstage-ft");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className={labelClass}>
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={emailValue}
          onChange={(event) => setEmailInput(event.target.value)}
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-bone-dim">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRememberOverride(event.target.checked)}
          className="size-4 accent-brass"
        />
        Lembrar meu e-mail
      </label>

      {error ? (
        <p role="alert" className="text-sm text-brass-soft">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-brass px-8 py-3 text-sm font-medium uppercase tracking-[0.24em] text-ink transition-colors hover:bg-brass-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
