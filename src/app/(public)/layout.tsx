import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Área PÚBLICA: `/`, `/filmes`, `/filmes/[publicSlug]`.
 * Header comercial completo + rodapé da marca. (Route group `(public)` —
 * não muda as URLs.)
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
