import Link from "next/link";
import { getAdminPartnerCategoryOptions } from "@/lib/admin/queries";
import { PartnerForm } from "../partner-form";
import { createPartnerAction } from "../actions";

export const metadata = { title: "Novo parceiro" };

export default async function NewPartnerPage() {
  const categories = await getAdminPartnerCategoryOptions();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link
            href="/backstage-ft/curadoria"
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← Curadoria
          </Link>
          <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
            Novo parceiro
          </h1>
          <p className="text-sm text-bone-dim">
            O endereço público é gerado automaticamente a partir do nome.
          </p>
        </header>

        <PartnerForm
          action={createPartnerAction}
          categories={categories}
          submitLabel="Salvar parceiro"
          cancelHref="/backstage-ft/curadoria"
          initial={{
            categoryId: "",
            name: "",
            shortDescription: "",
            description: "",
            recommendationText: "",
            location: "",
            whatsappNumber: "",
            instagramUrl: "",
            websiteUrl: "",
            videoSourceUrl: "",
            featured: false,
            sortOrder: "0",
            status: "draft",
          }}
        />
      </div>
    </section>
  );
}
