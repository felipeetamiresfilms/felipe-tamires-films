import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminPartnerCategoryOptions,
  getAdminPartnerDetail,
} from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { youtubeWatchUrl } from "@/lib/admin/youtube";
import { PartnerForm } from "../../partner-form";
import { updatePartnerAction } from "../../actions";

export const metadata = { title: "Editar parceiro" };

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [partner, categories] = await Promise.all([
    getAdminPartnerDetail(id),
    getAdminPartnerCategoryOptions(),
  ]);
  if (!partner) notFound();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link
            href={`/backstage-ft/curadoria/${partner.id}`}
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← {partner.name}
          </Link>
          <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
            Editar parceiro
          </h1>
          <p className="text-sm text-bone-dim">
            O endereço público não muda ao editar.
          </p>
        </header>

        <PartnerForm
          action={updatePartnerAction}
          categories={categories}
          submitLabel="Salvar alterações"
          cancelHref={`/backstage-ft/curadoria/${partner.id}`}
          partnerId={partner.id}
          initial={{
            categoryId: partner.categoryId,
            name: partner.name,
            shortDescription: partner.shortDescription ?? "",
            description: partner.description ?? "",
            recommendationText: partner.recommendationText ?? "",
            location: partner.location ?? "",
            whatsappNumber: partner.whatsappNumber ?? "",
            instagramUrl: partner.instagramUrl ?? "",
            websiteUrl: partner.websiteUrl ?? "",
            videoSourceUrl: partner.videoProviderId
              ? youtubeWatchUrl(partner.videoProviderId)
              : "",
            featured: partner.featured,
            sortOrder: String(partner.sortOrder),
            status: partner.status,
          }}
        />
      </div>
    </section>
  );
}
