import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RevealScanner } from "@/components/motion/RevealScanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_PHONE_E164, SITE_URL } from "@/config/site";

/**
 * Área PÚBLICA: `/`, `/filmes`, `/filmes/[publicSlug]`, `/pacotes`,
 * `/recomendamos`. Header comercial completo + rodapé da marca.
 * (Route group `(public)` — não muda as URLs.)
 *
 * SEO desta camada (só afeta rotas públicas — as privadas ficam de fora):
 * indexação liberada com previews de imagem grandes + Twitter card, e o
 * JSON-LD de identidade da empresa (Organization + WebSite).
 */
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  twitter: { card: "summary_large_image" },
};

const IDENTITY_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: ["Felipe e Tamires", "Felipe Tamires Films"],
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      image: `${SITE_URL}/imgs/felipe-e-tamires.jpg`,
      description:
        "Produtora de filmes de eventos — casamentos, 15 anos e aniversários — com linguagem cinematográfica.",
      telephone: SITE_PHONE_E164,
      knowsAbout: [
        "Filme de casamento",
        "Filmagem de casamento",
        "Filme de 15 anos",
        "Filmagem de festa de 15 anos",
        "Filme de aniversário",
        "Produção audiovisual de eventos",
        "Reels de eventos",
        "Fotografia espontânea em eventos",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={IDENTITY_JSON_LD} />
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
      <RevealScanner />
    </>
  );
}
