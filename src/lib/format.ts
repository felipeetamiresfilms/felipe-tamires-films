/** Funções de formatação para exibição em pt-BR. */

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  // eventDate é uma data de calendário (sem fuso). Formatar em UTC evita
  // que o fuso do servidor jogue a data para o dia anterior.
  timeZone: "UTC",
});

/** "2026-08-15" (ou "2026-08-15T..." ) -> "15 de agosto de 2026" */
export function formatEventDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return dateFormatter.format(date);
}

/**
 * Duração em segundos -> texto curto.
 * < 1h  -> "4:12"
 * >= 1h -> "1h 12min"
 */
export function formatDuration(
  seconds?: number | null,
): string | null {
  if (!seconds || seconds <= 0) return null;

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
