/**
 * Conteúdo comercial da página pública `/pacotes`.
 *
 * Dados EDITORIAIS (copy, entregáveis, frases, imagens dos tipos de evento)
 * separados da apresentação. Tudo aqui é informação pública — nada de preços,
 * nada de segredos: pode viver no client bundle.
 *
 * Para ajustar copy, entregáveis, durações ou imagens depois, edite só este
 * arquivo — a página e os componentes não precisam mudar.
 *
 * PROGRESSÃO (regra de apresentação):
 * - Essência lista tudo que você recebe de entrada.
 * - Memória = "Tudo do Essência +" e lista SÓ o que adiciona, amplia ou
 *   substitui por uma versão superior — nada que já venha no Essência.
 * - Experiência = "Tudo do Memória +" com a mesma regra.
 * Drone: NÃO entra no Essência; entra a partir do Memória (e o Experiência
 * herda via "Tudo do Memória +", sem repetir o item).
 */

/** Categorias comerciais da página (não confundir com o enum `EventType` do domínio). */
export type PackageEventType = "15-anos" | "casamento" | "aniversario";

/** Níveis de pacote, do essencial ao completo. */
export type PackageTier = "essencia" | "memoria" | "experiencia";

/** O nível-clímax da seção. Um só por categoria. */
export const FEATURED_TIER: PackageTier = "experiencia";

/** Selo do nível em destaque (o CSS/props cuidam do versalete). */
export const FEATURED_BADGE = "Experiência completa";

/**
 * Bloco editorial "Veja como essa história ganha vida." — fora dos cards de
 * pacote, depois da nota de duração. O rótulo do botão vem de cada evento
 * (`exampleFilmMeta` -> `exampleFilmLabel`); o destino é `exampleFilmHref`.
 */
export const EXAMPLE_FILM_BLOCK = {
  eyebrow: "Em filme",
  title: "Veja como essa história ganha vida.",
  text: "Conheça um filme produzido por nós e veja como transformamos esses momentos em memória.",
  /** Indicação MUITO sutil enquanto `exampleFilmHref` for `null` (só dev). */
  pendingHint: "Filme em configuração",
} as const;

export interface PackageEventMeta {
  id: PackageEventType;
  /** Rótulo curto — card de seleção e título das seções. */
  label: string;
  /** Uma linha de apoio no card de seleção. */
  hint: string;
  /**
   * Imagem representativa do card de seleção (arquivo real em `public/imgs/`).
   * `null` cai num fundo cinematográfico só-CSS (`fallbackGradient`).
   */
  image: string | null;
  /** Descrição da cena (para `alt` caso a imagem passe a ser informativa). */
  imageAlt: string;
  /** Fundo de reserva enquanto não há imagem — mesma linguagem do portfólio. */
  fallbackGradient: string;
  /** Termo usado na mensagem de WhatsApp: "...para {whatsappNoun}." */
  whatsappNoun: string;
  /**
   * Filme público de referência da categoria — usado no bloco "Veja como essa
   * história ganha vida.". DEVE apontar para a rota pública existente
   * `/filmes/[publicSlug]` (NUNCA privateSlug nem rota privada).
   * `null` até Felipe escolher: enquanto for `null`, o bloco ainda aparece,
   * mas o botão fica desabilitado (sem link quebrado).
   */
  exampleFilmHref: string | null;
  /** Texto do botão do bloco de filme (o CSS aplica o versalete). */
  exampleFilmLabel: string;
}

export interface PackageDef {
  tier: PackageTier;
  /** Nome de exibição. */
  name: string;
  /** Frase-conceito curta, logo abaixo do nome. */
  concept: string;
  /**
   * Degrau de progressão ("Tudo do Memória +"). Quando presente, a lista
   * abaixo traz APENAS os upgrades daquele nível — nada repetido do anterior.
   */
  buildsOn?: string;
  /** Entregáveis (base no Essência; só os upgrades no Memória/Experiência). */
  deliverables: string[];
  /** Frase emocional que fecha o card. */
  closingLine: string;
}

/** Texto do CTA por nível (o CSS aplica o versalete). */
export const TIER_CTA_LABEL: Record<PackageTier, string> = {
  essencia: "Quero conhecer o Essência",
  memoria: "Quero conhecer o Memória",
  experiencia: "Quero a Experiência completa",
};

/**
 * Nota sobre durações — vale para todos os limites ("até X minutos").
 * Limite máximo previsto, não duração obrigatória.
 */
export const DURATION_NOTE =
  "As durações indicadas são limites máximos previstos. O corte final acompanha o ritmo da história — às vezes um filme mais curto emociona mais.";

/**
 * Bloco editorial das fotografias — aparece só na categoria Aniversário.
 * Fala do resultado e da proposta artística, sem tom defensivo e sem
 * explicar tecnicamente de onde vêm as imagens.
 */
export const PHOTO_EDITORIAL = {
  eyebrow: "Fotografia",
  title: "Fotografias que nascem do movimento.",
  body: [
    "Nos pacotes Memória e Experiência, o aniversário também rende uma seleção de fotografias espontâneas — feitas a partir dos momentos acompanhados durante a cobertura audiovisual.",
    "Elas priorizam expressões, encontros, detalhes e a naturalidade de quem não está posando. É uma proposta diferente da cobertura fotográfica tradicional, feita de sessões dirigidas e retratos protocolares: aqui, a imagem nasce do movimento da festa.",
  ],
} as const;

export const PACKAGE_EVENT_TYPES: PackageEventMeta[] = [
  {
    id: "15-anos",
    label: "15 anos",
    hint: "A noite dela, do primeiro retoque ao último abraço.",
    image: "/imgs/15-anos.webp",
    imageAlt:
      "Debutante em vestido de gala sob luz quente durante a valsa.",
    fallbackGradient: [
      "radial-gradient(120% 85% at 18% 12%, rgba(216,189,147,0.22), transparent 60%)",
      "radial-gradient(130% 120% at 85% 100%, rgba(150,92,74,0.30), transparent 55%)",
      "linear-gradient(160deg, #201811 0%, #0c0a08 100%)",
    ].join(","),
    whatsappNoun: "15 anos",
    exampleFilmHref: "/filmes/15-anos-da-mari",
    exampleFilmLabel: "Assista a um 15 anos feito por nós",
  },
  {
    id: "casamento",
    label: "Casamento",
    hint: "A cerimônia, a festa e tudo que acontece nos intervalos.",
    image: "/imgs/casamento.webp",
    imageAlt:
      "Casal de mãos dadas ao fim da cerimônia, convidados desfocados ao fundo.",
    fallbackGradient: [
      "radial-gradient(120% 85% at 20% 14%, rgba(216,189,147,0.20), transparent 60%)",
      "radial-gradient(130% 120% at 82% 100%, rgba(120,88,58,0.32), transparent 55%)",
      "linear-gradient(160deg, #1e1712 0%, #0b0908 100%)",
    ].join(","),
    whatsappNoun: "casamento",
    exampleFilmHref: "/filmes/ensaio-de-casamento-lucieli-e-ettore",
    exampleFilmLabel: "Assista a um casamento feito por nós",
  },
  {
    id: "aniversario",
    label: "Aniversário",
    hint: "Do brinde à pista — o dia inteiro em filme e fotografia.",
    image: "/imgs/aniversario.webp",
    imageAlt:
      "Mesa de festa iluminada por velas, pessoas rindo ao redor.",
    fallbackGradient: [
      "radial-gradient(120% 85% at 22% 16%, rgba(224,182,124,0.20), transparent 60%)",
      "radial-gradient(130% 120% at 84% 100%, rgba(140,74,52,0.30), transparent 55%)",
      "linear-gradient(160deg, #1f1610 0%, #0b0908 100%)",
    ].join(","),
    whatsappNoun: "aniversário",
    exampleFilmHref: "/filmes/80-anos-da-odeti",
    exampleFilmLabel: "Assista a um aniversário feito por nós",
  },
];

/** Type guard para o parâmetro `?evento=` da URL — aceita só os IDs conhecidos. */
export function isPackageEventType(value: unknown): value is PackageEventType {
  return (
    typeof value === "string" &&
    PACKAGE_EVENT_TYPES.some((event) => event.id === value)
  );
}

export const PACKAGES_BY_EVENT: Record<PackageEventType, PackageDef[]> = {
  casamento: [
    {
      tier: "essencia",
      name: "Essência",
      concept: "Registro emocional, moderno e bem produzido.",
      deliverables: [
        "Captação profissional do evento (cerimônia + festa — momentos principais)",
        "1 trailer de até 8 minutos",
        "1 reel vertical de até 1min30 para Instagram/TikTok",
        "Edição profissional + color grading",
        "Entrega digital em 4K",
      ],
      closingLine:
        "Para casais que querem um registro emocional, moderno e bem produzido.",
    },
    {
      tier: "memoria",
      name: "Memória",
      concept: "Guardar mais da história, sem perder o apelo cinematográfico.",
      buildsOn: "Tudo do Essência +",
      deliverables: [
        "Captação completa da cerimônia",
        "Cerimônia/registro na íntegra quando aplicável",
        "1 filme de até 40 minutos",
        "Drone incluso quando as condições e o local permitirem",
        "Ajustes de áudio",
      ],
      closingLine:
        "Para quem quer guardar tudo, sem perder o apelo cinematográfico.",
    },
    {
      tier: "experiencia",
      name: "Experiência",
      concept: "Não precisar escolher o que ficará de fora.",
      buildsOn: "Tudo do Memória +",
      deliverables: [
        "Filme do making of dos noivos ou clipe dos noivos",
        "Cerimônia completa, na íntegra (sem depender das condições do dia)",
      ],
      closingLine:
        "A história inteira — sem precisar escolher o que fica de fora.",
    },
  ],
  "15-anos": [
    {
      tier: "essencia",
      name: "Essência",
      concept: "Registro emocional, moderno e bem produzido.",
      deliverables: [
        "Captação profissional da festa e momentos-chave",
        "1 trailer de até 8 minutos",
        "1 reel vertical de até 1min30 para Instagram/TikTok",
        "Edição profissional + color grading",
        "Entrega digital em 4K",
      ],
      closingLine:
        "Pensado para quem quer um registro emocional, moderno e bem produzido.",
    },
    {
      tier: "memoria",
      name: "Memória",
      concept: "Guardar tudo, sem perder o apelo cinematográfico.",
      buildsOn: "Tudo do Essência +",
      deliverables: [
        "Cerimônia/apresentações completas, na íntegra",
        "1 filme de até 40 minutos",
        "Drone incluso quando as condições e o local permitirem",
        "Ajustes de áudio",
        "Edição completa (íntegra + filme)",
      ],
      closingLine:
        "Para quem quer guardar tudo, sem perder o apelo cinematográfico.",
    },
    {
      tier: "experiencia",
      name: "Experiência",
      concept: "Não precisar escolher o que ficará de fora.",
      buildsOn: "Tudo do Memória +",
      deliverables: ["Making of da debutante"],
      closingLine:
        "A experiência completa, do começo ao fim, sem cortes na história.",
    },
  ],
  aniversario: [
    {
      tier: "essencia",
      name: "Essência",
      concept: "Guardar em filme os momentos que fizeram aquele dia especial.",
      deliverables: [
        "Captação profissional dos principais momentos do aniversário",
        "1 filme cinematográfico de até 5 minutos",
        "1 reel vertical de até 1min30",
        "Edição profissional + color grading",
        "Entrega digital em 4K",
      ],
      closingLine:
        "Para guardar em filme os momentos que fizeram aquele dia especial.",
    },
    {
      tier: "memoria",
      name: "Memória",
      concept: "Filme e fotografias para guardar a celebração de mais de um jeito.",
      buildsOn: "Tudo do Essência +",
      deliverables: [
        "Cobertura mais completa do evento",
        "Filme cinematográfico ampliado para até 8 minutos",
        "Até 30 fotografias espontâneas em alta qualidade",
        "Registros de momentos, detalhes e interações captados durante a cobertura",
        "Entrega digital das fotografias",
        "Drone incluso quando as condições e o local permitirem",
      ],
      closingLine:
        "A celebração guardada de mais de um jeito — em movimento e em imagem.",
    },
    {
      tier: "experiencia",
      name: "Experiência",
      concept: "Não precisar escolher o que ficará de fora.",
      buildsOn: "Tudo do Memória +",
      deliverables: [
        "Cobertura audiovisual ainda mais completa da celebração",
        "Filme cinematográfico ampliado para até 15 minutos",
        "Fotografias ampliadas para até 60 imagens espontâneas",
        "Entrevistas e depoimentos como camada garantida da narrativa do filme",
      ],
      closingLine:
        "O dia inteiro — em filme, em retrato e nas palavras de quem estava lá.",
    },
  ],
};
