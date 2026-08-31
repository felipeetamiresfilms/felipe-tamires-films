import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadBackstageAccess } from "@/lib/admin/auth";
import { Wordmark } from "@/components/ui/Wordmark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function BackstageLoginPage() {
  const access = await loadBackstageAccess();

  // Admin já logado não vê o formulário de novo.
  if (access.state === "ok") {
    redirect("/backstage-ft");
  }

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-24 sm:px-8">
      <div className="rise flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wordmark size="lg" />
          <p className="text-xs uppercase tracking-[0.32em] text-brass">
            Área administrativa
          </p>
        </div>

        {access.state === "forbidden" ? (
          <p className="rounded-lg border border-hairline bg-surface px-4 py-3 text-center text-sm text-bone-dim">
            Esta conta não tem acesso ao painel. Entre com uma conta autorizada.
          </p>
        ) : null}

        <LoginForm />
      </div>
    </section>
  );
}
