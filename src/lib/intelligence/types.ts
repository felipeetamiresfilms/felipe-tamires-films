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
