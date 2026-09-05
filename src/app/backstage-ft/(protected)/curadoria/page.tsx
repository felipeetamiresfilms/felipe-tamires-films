import Link from "next/link";
import { getAdminPartners } from "@/lib/admin/queries";
import { StatusBadge } from "@/components/backstage/StatusBadge";
import {
  ghostButtonClass,
  primaryButtonClass,
  subtleButtonClass,
} from "@/components/backstage/form-ui";

export const metadata = { title: "Curadoria" };

export default async function CuradoriaListPage() {
  const partners = await getAdminPartners();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.32em] text-brass">
              Painel
            </p>
            <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
              Curadoria
            </h1>
          </div>
          <Link
            href="/backstage-ft/curadoria/novo"
            className={primaryButtonClass}
          >
            + Novo parceiro
          </Link>
        </header>

        {partners.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-hairline bg-surface p-6">
            <p className="text-sm text-bone-dim">
              Nenhum parceiro cadastrado.
            </p>
            <Link
              href="/backstage-ft/curadoria/novo"
              className={ghostButtonClass}
            >
              Novo parceiro
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {partners.map((partner) => (
              <li
                key={partner.id}
                className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-lg font-light text-bone">
                      {partner.name}
                    </h2>
                    <StatusBadge status={partner.status} />
                    {partner.featured ? (
                      <span className="inline-flex items-center rounded-full border border-brass/50 bg-raised/60 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-brass-soft">
                        Destaque
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-bone-dim">
                    {partner.categoryName}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 self-start">
                  <Link
                    href={`/backstage-ft/curadoria/${partner.id}`}
                    className={subtleButtonClass}
                  >
                    Abrir
                  </Link>
                  {partner.status === "published" ? (
                    <a
                      href={`/recomendamos/${partner.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={subtleButtonClass}
                    >
                      Ver página
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
