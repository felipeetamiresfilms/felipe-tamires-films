import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminClientDetail } from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { ClientForm } from "../../client-form";
import { updateClientAction } from "../../actions";

export const metadata = { title: "Editar cliente" };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const client = await getAdminClientDetail(id);
  if (!client) notFound();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link
            href={`/backstage-ft/clientes/${client.id}`}
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← {client.displayName}
          </Link>
          <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
            Editar cliente
          </h1>
        </header>

        <ClientForm
          action={updateClientAction}
          submitLabel="Salvar alterações"
          cancelHref={`/backstage-ft/clientes/${client.id}`}
          clientId={client.id}
          initial={{
            displayName: client.displayName,
            email: client.email ?? "",
            phone: client.phone ?? "",
          }}
        />
      </div>
    </section>
  );
}
