import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadBackstageAccess } from "@/lib/admin/auth";
import { Wordmark } from "@/components/ui/Wordmark";
import { BackstageNav } from "@/components/backstage/BackstageNav";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  robots: { index: false, follow: false },
};

export default async function BackstageProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await loadBackstageAccess();

  if (access.state === "anon") {
    redirect("/backstage-ft/login");
  }

  if (access.state === "forbidden") {
    return (
      <section className="flex flex-1 items-center justify-center px-6 py-24 text-center sm:px-8">
        <div className="flex max-w-md flex-col items-center gap-5">
          <p className="text-xs uppercase tracking-[0.32em] text-brass">
            Acesso negado
          </p>
          <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
            Sua conta não tem acesso ao painel.
          </h1>
          <p className="text-sm leading-relaxed text-bone-dim">
            Se isso for um engano, peça a um administrador para incluir o seu
            acesso.
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-2 rounded-full border border-brass/50 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.24em] text-bone transition-colors hover:border-brass"
            >
              Sair
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-hairline/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 sm:px-8 2xl:max-w-[88rem]">
          <div className="flex items-baseline gap-3">
            <Wordmark />
            <span className="hidden text-xs uppercase tracking-[0.28em] text-bone-dim sm:inline">
              Painel
            </span>
          </div>

          <BackstageNav className="order-3 w-full justify-start sm:order-2 sm:w-auto" />

          <div className="order-2 ml-auto flex items-center gap-4 sm:order-3">
            <span className="hidden text-xs text-bone-dim sm:inline">
              {access.displayName}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="min-h-9 text-xs uppercase tracking-[0.22em] text-bone-dim transition-colors hover:text-bone"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
