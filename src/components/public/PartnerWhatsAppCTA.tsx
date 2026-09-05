import { ctaPrimaryClass } from "./cta";

/**
 * Contato direto com o PARCEIRO recomendado — nunca com o WhatsApp da
 * Felipe & Tamires Films (seção 15 do briefing de Nossa Curadoria). Por isso
 * não reaproveita `WhatsAppCTA` (que sempre aponta para `SITE_CONFIG`).
 */
export function PartnerWhatsAppCTA({
  whatsappNumber,
  partnerName,
}: {
  whatsappNumber: string;
  partnerName: string;
}) {
  const message = `Olá! Vim pelo site da Felipe & Tamires Films e gostaria de saber mais sobre ${partnerName}.`;
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Falar com ${partnerName} — abre o WhatsApp`}
      className={ctaPrimaryClass}
    >
      Falar com {partnerName}
    </a>
  );
}
