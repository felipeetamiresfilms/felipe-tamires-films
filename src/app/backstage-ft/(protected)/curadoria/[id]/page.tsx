import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminPartnerDetail } from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { publishStatusLabels } from "@/lib/labels";
import { createServerAuthClient } from "@/lib/supabase/server";
import { FeedbackBanner } from "@/components/backstage/FeedbackBanner";
import { StatusBadge } from "@/components/backstage/StatusBadge";
import { CopyLinkButton } from "@/components/backstage/CopyLinkButton";
import { ghostButtonClass, subtleButtonClass } from "@/components/backstage/form-ui";
import { SubmitButton } from "@/components/backstage/SubmitButton";
import {
  addPartnerMediaAction,
  movePartnerMediaAction,
  removePartnerCoverAction,
  removePartnerMediaAction,
  setPartnerCoverAction,
} from "../actions";

const PARTNER_BUCKET = "partner-media";

export const metadata = { title: "Parceiro" };

export default async function PartnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [partner, { ok, erro }] = await Promise.all([
    getAdminPartnerDetail(id),
    searchParams,
  ]);
  if (!partner) notFound();

  const supabase = await createServerAuthClient();

  const coverPreviewUrl = partner.coverImagePath
    ? supabase.storage.from(PARTNER_BUCKET).getPublicUrl(partner.coverImagePath)
        .data.publicUrl
    : null;

  const galleryUrls = new Map<string, string>();
  for (const item of partner.media) {
    const { data } = supabase.storage
      .from(PARTNER_BUCKET)
      .getPublicUrl(item.storagePath);
    if (data.publicUrl) galleryUrls.set(item.id, data.publicUrl);
  }

  const info: Array<[string, string]> = [
    ["Categoria", partner.categoryName],
    ["Localização", partner.location ?? "—"],
    ["Status", publishStatusLabels[partner.status]],
    ["Destaque", partner.featured ? "Sim" : "Não"],
    ["Ordem", String(partner.sortOrder)],
  ];

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/backstage-ft/curadoria"
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← Curadoria
          </Link>

          <FeedbackBanner code={ok} error={erro} />

          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
                {partner.name}
              </h1>
              <StatusBadge status={partner.status} />
            </div>
          </header>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/backstage-ft/curadoria/${partner.id}/editar`}
              className={ghostButtonClass}
            >
              Editar parceiro
            </Link>
            {partner.status === "published" ? (
              <a
                href={`/recomendamos/${partner.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={ghostButtonClass}
              >
                Abrir página pública
              </a>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-hairline bg-surface p-6 sm:grid-cols-3">
          {info.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-[0.2em] text-bone-dim">
                {label}
              </dt>
              <dd className="text-sm text-bone">{value}</dd>
            </div>
          ))}
        </dl>

        {partner.status === "published" ? (
          <div className="flex flex-col gap-3 rounded-xl border border-brass/30 bg-raised/40 p-6">
            <h2 className="text-xs uppercase tracking-[0.28em] text-brass">
              Página pública
            </h2>
            <CopyLinkButton path={`/recomendamos/${partner.slug}`} />
          </div>
        ) : null}

        {/* Capa */}
        <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-6">
          <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
            Capa
          </h2>

          {coverPreviewUrl ? (
            <Image
              src={coverPreviewUrl}
              alt={`Capa de ${partner.name}`}
              width={640}
              height={360}
              unoptimized
              className="max-w-xl rounded-lg border border-hairline object-cover"
              style={{ width: "100%", height: "auto", aspectRatio: "16 / 9" }}
            />
          ) : (
            <p className="text-sm text-bone-dim">Sem capa ainda.</p>
          )}

          <form
            action={setPartnerCoverAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="partnerId" value={partner.id} />
            <input
              type="file"
              name="cover"
              accept="image/jpeg,image/png,image/webp"
              required
              className="min-h-11 max-w-full text-sm text-bone-dim file:mr-3 file:min-h-9 file:rounded-full file:border file:border-brass/50 file:bg-transparent file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.2em] file:text-bone hover:file:border-brass"
            />
            <SubmitButton variant="subtle" pendingLabel="Enviando…">
              {partner.coverImagePath ? "Trocar capa" : "Adicionar capa"}
            </SubmitButton>
          </form>

          <p className="text-xs text-bone-dim/80">
            JPEG, PNG ou WEBP, até 10&nbsp;MB. Ideal: imagem horizontal (16:9).
          </p>

          {partner.coverImagePath ? (
            <form action={removePartnerCoverAction}>
              <input type="hidden" name="partnerId" value={partner.id} />
              <SubmitButton variant="subtle" pendingLabel="Removendo…">
                Remover capa
              </SubmitButton>
            </form>
          ) : null}
        </div>

        {/* Galeria */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
            Galeria
          </h2>

          <form
            action={addPartnerMediaAction}
            className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-6 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="partnerId" value={partner.id} />
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              required
              className="min-h-11 max-w-full text-sm text-bone-dim file:mr-3 file:min-h-9 file:rounded-full file:border file:border-brass/50 file:bg-transparent file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.2em] file:text-bone hover:file:border-brass"
            />
            <SubmitButton variant="subtle" pendingLabel="Enviando…">
              Adicionar foto
            </SubmitButton>
          </form>

          {partner.media.length === 0 ? (
            <p className="rounded-xl border border-hairline bg-surface p-6 text-sm text-bone-dim">
              Nenhuma foto na galeria.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {partner.media.map((item, index) => {
                const url = galleryUrls.get(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-3"
                  >
                    {url ? (
                      <Image
                        src={url}
                        alt=""
                        width={320}
                        height={200}
                        unoptimized
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="aspect-video w-full rounded-lg bg-raised" />
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-1">
                        <form action={movePartnerMediaAction}>
                          <input type="hidden" name="partnerId" value={partner.id} />
                          <input type="hidden" name="mediaId" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={index === 0}
                            aria-label="Mover para cima"
                            className={subtleButtonClass}
                          >
                            ↑
                          </button>
                        </form>
                        <form action={movePartnerMediaAction}>
                          <input type="hidden" name="partnerId" value={partner.id} />
                          <input type="hidden" name="mediaId" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={index === partner.media.length - 1}
                            aria-label="Mover para baixo"
                            className={subtleButtonClass}
                          >
                            ↓
                          </button>
                        </form>
                      </div>
                      <form action={removePartnerMediaAction}>
                        <input type="hidden" name="partnerId" value={partner.id} />
                        <input type="hidden" name="mediaId" value={item.id} />
                        <button type="submit" className={subtleButtonClass}>
                          Remover
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
