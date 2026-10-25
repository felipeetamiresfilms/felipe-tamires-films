/**
 * Grupos de origem pedidos pela FTF (Google, Instagram…). Sem dependências:
 * usado pelo painel de tráfego e pelo de contatos, e testável com `node --test`.
 */

/** Ordem fixa dos grupos de origem pedidos pela FTF. */
export const SOURCE_GROUPS = [
  "Google",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Acesso direto",
  "Outras fontes",
] as const;

export function sourceGroupOf(source: string): (typeof SOURCE_GROUPS)[number] {
  const s = source.toLowerCase();
  if (s === "(direct)") return "Acesso direto";
  if (s.includes("google")) return "Google";
  if (s.includes("instagram") || s === "ig") return "Instagram";
  if (s.includes("facebook") || s === "fb" || s === "meta") return "Facebook";
  if (s.includes("whatsapp") || s === "wa" || s === "wa.me") return "WhatsApp";
  return "Outras fontes";
}

