import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPartnerBySlug } from "@/lib/curadoria";
import { PartnerWhatsAppCTA } from "@/components/public/PartnerWhatsAppCTA";

export const dynamic = "force-dynamic";

type PageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);

  if (!partner) {
    return { title: "Não encontrado", robots: { index: false } };
  }

  const description =
    partner.shortDescription ??
    `${partner.categoryName}${
      partner.location ? ` em ${partner.location}` : ""
    } — recomendado pela Felipe & Tamires Films.`;

  return {
    title: { absolute: `${partner.name} | Felipe & Tamires Films` },
    description,
    alternates: { canonical: `/recomendamos/${partner.slug}` },
    openGraph: {
      title: `${partner.name} | Felipe & Tamires Films`,
      description,
      type: "website",
    },
  };
}

export default async function PartnerPublicPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);

  if (!partner) {
    notFound();
  }

  const metaLine = [partner.categoryName, partner.location]
    .filter(Boolean)
    .join(" · ");
  const hasContact = Boolean(
    partner.whatsappNumber || partner.instagramUrl || partner.websiteUrl,
  );

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative isolate flex min-h-[46svh] items-end overflow-hidden border-b border-hairline">
        <div className="absolute inset-0">
          {partner.coverUrl ? (
            <Image
              src={partner.coverUrl}
              alt={`Foto de ${partner.name}`}
              fill
              unoptimized
              sizes="100vw"
              className="cine-kenburns object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage: [
                  "radial-gradient(90% 60% at 20% 0%, rgba(216,189,147,0.16), transparent 60%)",
                  "radial-gradient(120% 120% at 90% 100%, rgba(120,88,58,0.28), transparent 55%)",
                  "linear-gradient(180deg, #14100c 0%, #0a0908 100%)",
                ].join(","),
              }}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />

        <div className="relative mx-auto w-full max-w-6xl px-6 py-14 sm:px-8 sm:py-16 2xl:max-w-[88rem]">
          <div className="cine-stack flex max-w-2xl flex-col gap-4">
            <span className="text-xs uppercase tracking-[0.32em] text-brass">
              {partner.categoryName}
            </span>
            <h1 className="font-display font-light leading-[1.03] text-bone [font-size:clamp(2rem,5vw,4rem)]">
              {partner.name}
            </h1>
            {metaLine ? (
              <p className="text-sm uppercase tracking-[0.2em] text-bone-dim sm:text-base">
                {metaLine}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-24 2xl:max-w-[88rem]">
        <div className="flex flex-col gap-16">
          {partner.description ? (
            <section data-reveal="up" className="flex flex-col gap-4">
              <h2 className="text-xs uppercase tracking-[0.32em] text-brass">
                Sobre
              </h2>
              <p className="max-w-prose text-sm leading-relaxed text-bone-dim sm:text-base">
                {partner.description}
              </p>
            </section>
          ) : null}

          {partner.recommendationText ? (
            <section
              data-reveal="soft"
              className="border-l border-brass/40 pl-6 sm:pl-10"
            >
              <p className="text-xs uppercase tracking-[0.32em] text-brass">
                Por que indicamos
              </p>
              <p className="mt-4 max-w-prose font-display text-xl font-light italic leading-relaxed text-bone sm:text-2xl">
                &ldquo;{partner.recommendationText}&rdquo;
              </p>
            </section>
          ) : null}

          {partner.gallery.length > 0 ? (
            <section data-reveal-stagger className="flex flex-col gap-5">
              <h2 className="text-xs uppercase tracking-[0.32em] text-brass">
                Galeria
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {partner.gallery.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg border border-hairline bg-surface"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.altText ?? `Foto de ${partner.name}`}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {partner.videoEmbedUrl ? (
            <section data-reveal="up" className="flex flex-col gap-5">
              <h2 className="text-xs uppercase tracking-[0.32em] text-brass">
                Conheça o trabalho
              </h2>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-hairline bg-ink">
                <iframe
                  src={partner.videoEmbedUrl}
                  title={`Vídeo — ${partner.name}`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </section>
          ) : null}

          {hasContact ? (
            <section
              data-reveal="soft"
              className="flex flex-col gap-5 rounded-2xl border border-hairline bg-surface/40 px-6 py-10 sm:px-10"
            >
              <h2 className="text-xs uppercase tracking-[0.32em] text-brass">
                Contato
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                {partner.whatsappNumber ? (
                  <PartnerWhatsAppCTA
                    whatsappNumber={partner.whatsappNumber}
                    partnerName={partner.name}
                  />
                ) : null}
                {partner.instagramUrl ? (
                  <a
                    href={partner.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-bone underline decoration-hairline underline-offset-4 transition-colors hover:decoration-brass"
                  >
                    Instagram
                  </a>
                ) : null}
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-bone underline decoration-hairline underline-offset-4 transition-colors hover:decoration-brass"
                  >
                    Site
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
