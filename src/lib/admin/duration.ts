/**
 * Entrada amigável de duração <-> segundos.
 *
 * O administrador digita "15:12", "1:18" ou "1:02:05" (mm:ss ou h:mm:ss) e o
 * servidor converte para `duration_seconds`. Também aceita um inteiro puro de
 * segundos. Nunca exigimos que a pessoa calcule segundos na mão.
 */

/** "15:12" -> 912 | "1:02:05" -> 3725 | "912" -> 912 | inválido -> `null` */
export function parseDurationInput(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (value === "") return null;

  // Inteiro puro = segundos.
  if (/^\d+$/.test(value)) {
    const seconds = Number(value);
    return Number.isSafeInteger(seconds) ? seconds : null;
  }

  const parts = value.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((part) => /^\d+$/.test(part.trim()))) return null;

  const nums = parts.map((part) => Number(part.trim()));

  if (nums.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = nums;
  if (minutes >= 60 || seconds >= 60) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

/** 912 -> "15:12" | 3725 -> "1:02:05" | vazio -> "" (para pré-preencher forms). */
export function durationToInput(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`;
}
