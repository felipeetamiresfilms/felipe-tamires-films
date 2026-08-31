import { buildWhatsAppUrl } from "@/config/site";
import { ctaPrimaryClass, ctaSecondaryClass } from "./cta";

/**
 * Link de contato via WhatsApp com mensagem pré-preenchida.
 * Server Component — só um `<a>`, sem estética verde de WhatsApp: segue a
 * identidade (preto / marfim / latão). Texto sempre visível (nunca só ícone).
 */
export function WhatsAppCTA({
  message,
  label,
  variant = "primary",
  className = "",
}: {
  message: string;
  label: string;
  variant?: "primary" | "secondary" | "link";
  className?: string;
}) {
  const base =
    variant === "primary"
      ? ctaPrimaryClass
      : variant === "secondary"
        ? ctaSecondaryClass
        : "inline-flex items-center gap-1.5";

  return (
    <a
      href={buildWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — abre o WhatsApp`}
      className={`${base} ${className}`.trim()}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[1.1em] w-[1.1em] shrink-0 fill-current opacity-80"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14 0-.31-.02-.47-.02-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
      </svg>
      {label}
    </a>
  );
}
