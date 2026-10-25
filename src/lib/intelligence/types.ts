/**
 * Formas dos dados do painel de Inteligência. Sem dependências: pode ser
 * importado por componentes de cliente (só tipos e constantes).
 */

/** "hoje" = dia em andamento (fuso da propriedade); números = dias completos. */
export const PERIODS = ["hoje", 7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
export type DaysPeriod = Exclude<Period, "hoje">;
export const DEFAULT_PERIOD: Period = 30;

/** Métricas de usuário, sessão e evento ficam separadas — não se somam. */
export type Totals = {
  /** Usuários ativos (usuários). */
  activeUsers: number;
  /** Sessões. */
  sessions: number;
  /** Visualizações de página (eventos page_view). */
  views: number;
  /** Tempo médio de engajamento por usuário ativo, em segundos. */
  avgEngagementSeconds: number | null;
};

export type DailyPoint = {
  /**
   * No fuso da propriedade do GA4: "AAAA-MM-DD" (granularidade diária) ou
   * "HH" (granularidade horária, período "hoje").
   */
  date: string;
  sessions: number;
  users: number;
  views: number;
};

export type LabeledCount = { label: string; value: number };

export type CampaignRow = {
  name: string;
  sourceMedium: string;
  sessions: number;
  engagedSessions: number;
};

export type DashboardData = {
  period: Period;
  /** "hour" só no período "hoje". */
  granularity: "day" | "hour";
  /** `previous` é null quando não há comparação justa (dia em andamento). */
  totals: { current: Totals; previous: Totals | null };
  daily: DailyPoint[];
  /** Páginas por visualizações. */
  pages: { path: string; views: number; users: number }[];
  /** Sessões por grupo de origem (Google, Instagram…), ordem fixa. */
  sourceGroups: LabeledCount[];
  /** Sessões por agrupamento de canais padrão do GA4. */
  channels: LabeledCount[];
  /** Sessões por origem / mídia (top). */
  sourceMedium: LabeledCount[];
  campaigns: CampaignRow[];
  notes: { thresholded: boolean; otherRow: boolean; sampled: boolean };
  /** ISO — quando a consulta foi feita (pode vir do cache). */
  fetchedAt: string;
};

export type DashboardErrorKind =
  | "auth"
  | "permission"
  | "quota"
  | "invalid_request"
  | "network";

export type DashboardResult =
  | { status: "not_configured"; missing: string[] }
  | { status: "error"; kind: DashboardErrorKind }
  | { status: "empty"; data: DashboardData }
  | { status: "ok"; data: DashboardData };

/**
 * Conversões e contatos — evento `contact_click` (clique num botão que abre
 * o WhatsApp). Clique = intenção de contato, não mensagem enviada.
 *
 * "clicks" é contagem de EVENTOS; "sessions" é contagem de SESSÕES com ao
 * menos um clique. Nunca se usa uma no lugar da outra.
 */
export type ContactRow = { label: string; clicks: number; sessions: number };

export type ContactsData = {
  period: Period;
  /** Eventos `contact_click` no período. */
  clicks: number;
  /** Sessões com ao menos um `contact_click`. */
  contactSessions: number;
  /** Todas as sessões do mesmo período (denominador da taxa). */
  totalSessions: number;
  /** contactSessions / totalSessions (0–1); null sem sessões no período. */
  contactRate: number | null;
  /** Grupo de origem com mais sessões com contato; null sem contatos. */
  topSource: { label: string; sessions: number } | null;
  /** Por grupo de origem (ordem fixa de SOURCE_GROUPS). */
  bySource: ContactRow[];
  /** Por página do clique. Uma sessão pode aparecer em mais de uma página. */
  byPage: ContactRow[];
  /** Por campanha UTM da sessão. */
  byCampaign: (ContactRow & { sourceMedium: string })[];
  /**
   * Por ponto de contato (dimensão personalizada `contact_location`).
   * "unavailable" enquanto a dimensão não estiver registrada no GA4.
   */
  byButton: { status: "ok"; rows: { location: string; clicks: number }[] } | { status: "unavailable" };
  notes: { thresholded: boolean; otherRow: boolean; sampled: boolean };
  fetchedAt: string;
};

export type ContactsResult =
  | { status: "not_configured" }
  | { status: "error"; kind: DashboardErrorKind }
  | { status: "empty"; data: ContactsData }
  | { status: "ok"; data: ContactsData };
