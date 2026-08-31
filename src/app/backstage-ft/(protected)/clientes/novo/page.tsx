import Link from "next/link";
import { ClientForm } from "../client-form";
import { createClientAction } from "../actions";

export const metadata = { title: "Novo cliente" };

export default function NewClientPage() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link
            href="/backstage-ft/clientes"
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← Clientes
          </Link>
          <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
            Novo cliente
          </h1>
        </header>

        <ClientForm
          action={createClientAction}
          submitLabel="Salvar cliente"
          cancelHref="/backstage-ft/clientes"
        />
      </div>
    </section>
  );
}
