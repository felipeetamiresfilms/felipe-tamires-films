import Link from "next/link";
import { getAdminClients } from "@/lib/admin/queries";
import { formatEventDate } from "@/lib/format";
import {
  ghostButtonClass,
  primaryButtonClass,
} from "@/components/backstage/form-ui";

export const metadata = { title: "Clientes" };

export default async function ClientsListPage() {
  const clients = await getAdminClients();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.32em] text-brass">
              Painel
            </p>
            <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
              Clientes
            </h1>
          </div>
          <Link href="/backstage-ft/clientes/novo" className={primaryButtonClass}>
            + Novo cliente
          </Link>
        </header>

        {clients.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-hairline bg-surface p-6">
            <p className="text-sm text-bone-dim">Nenhum cliente cadastrado ainda.</p>
            <Link
              href="/backstage-ft/clientes/novo"
              className={ghostButtonClass}
            >
              Cadastrar o primeiro
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/backstage-ft/clientes/${client.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-brass/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1.5">
                    <h2 className="font-display text-lg font-light text-bone">
                      {client.displayName}
                    </h2>
                    <p className="text-sm text-bone-dim">
                      {[client.email, client.phone].filter(Boolean).join(" · ") ||
                        "Sem contato cadastrado"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 text-xs uppercase tracking-[0.16em] text-bone-dim sm:items-end">
                    <span>
                      {client.eventCount}{" "}
                      {client.eventCount === 1 ? "evento" : "eventos"}
                    </span>
                    <span>Desde {formatEventDate(client.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
