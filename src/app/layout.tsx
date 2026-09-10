import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/config/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Felipe & Tamires Films — Filmes de casamento, 15 anos e eventos",
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Felipe & Tamires Films é uma produtora de filmes de eventos: casamentos, 15 anos e aniversários registrados com linguagem cinematográfica — filmes para reviver, não apenas assistir.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Favicon / apple-touch: convenção de arquivo (`app/icon.png`,
  // `app/apple-icon.png`) — o Next gera os <link> com type/sizes corretos.
  // O `icon.svg` mora em `public/` só como logo da Organization no JSON-LD.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      {/*
        O chrome (header/footer) vive nos layouts de cada área, não aqui:
          (public)/layout.tsx  -> header comercial + rodapé
          assistir/layout.tsx  -> só a marca, discreta
          backstage-ft/layout.tsx -> sem chrome público (nav admin própria)
      */}
      <body className="flex min-h-full flex-col antialiased">
        {/*
          Progressive enhancement do motion design: marca <html> como "js"
          de forma síncrona, antes da 1ª pintura (sem flash), para o CSS
          poder esconder os blocos `data-reveal` e revelá-los na rolagem.
          Se o bundle JS falhar, um failsafe libera tudo 1,5s após o load.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');addEventListener('load',function(){setTimeout(function(){window.__revealReady||document.documentElement.classList.add('no-reveal')},1500)})",
          }}
        />
        {children}
      </body>
    </html>
  );
}
