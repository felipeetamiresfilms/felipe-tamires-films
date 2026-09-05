/**
 * Feedback simples das ações do painel, via query param `?ok=<código>` (e
 * `?erro=<código>` para falhas). Sem sistema de toast: a página lê
 * `searchParams` e renderiza esta faixa. Mensagens sempre amigáveis.
 */

const OK_MESSAGES: Record<string, string> = {
  "cliente-criado": "Cliente criado.",
  "cliente-atualizado": "Cliente atualizado.",
  "cliente-excluido": "Cliente excluído.",
  "evento-criado": "Evento criado.",
  "evento-atualizado": "Evento atualizado.",
  "evento-publicado": "Evento publicado. O link do cliente já funciona.",
  "evento-arquivado": "Evento arquivado. O link do cliente parou de funcionar.",
  "evento-restaurado": "Evento restaurado para rascunho.",
  "video-adicionado": "Vídeo adicionado.",
  "video-atualizado": "Vídeo atualizado.",
  "video-movido": "Ordem dos vídeos atualizada.",
  "capa-atualizada": "Capa atualizada.",
  "capa-removida": "Capa removida.",
  "portfolio-ativado": "Evento ativado no portfólio público.",
  "portfolio-desativado": "Evento removido do portfólio público.",
  "destaque-ativado": "Evento marcado como destaque na home.",
  "destaque-removido": "Destaque removido.",
  "portfolio-video": "Seleção de vídeos do portfólio atualizada.",
  "parceiro-criado": "Parceiro criado.",
  "parceiro-atualizado": "Parceiro atualizado.",
  "foto-adicionada": "Foto adicionada à galeria.",
  "foto-removida": "Foto removida da galeria.",
  "foto-movida": "Ordem da galeria atualizada.",
};

const ERROR_MESSAGES: Record<string, string> = {
  estado: "Essa ação não vale para o status atual do evento.",
  publicar: "Não foi possível publicar: confira o cliente e o título.",
  capa: "Não foi possível enviar a capa. Use JPEG, PNG ou WEBP de até 10 MB.",
  "portfolio-confirmar":
    "Confirme a autorização de uso antes de ativar o portfólio.",
  portfolio: "Não foi possível atualizar o portfólio. Tente de novo.",
  acao: "Não foi possível concluir a ação. Tente de novo.",
  galeria:
    "Não foi possível enviar a foto. Use JPEG, PNG ou WEBP de até 10 MB.",
};

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function FeedbackBanner({
  code,
  error,
}: {
  code?: string | string[];
  error?: string | string[];
}) {
  const okKey = pick(code);
  const errorKey = pick(error);

  const okMessage = okKey ? OK_MESSAGES[okKey] : undefined;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] : undefined;

  if (!okMessage && !errorMessage) return null;

  return (
    <p
      className={[
        "rounded-lg border px-4 py-3 text-sm",
        errorMessage
          ? "border-brass/40 bg-raised/60 text-brass-soft"
          : "border-brass/30 bg-raised/60 text-brass-soft",
      ].join(" ")}
    >
      {errorMessage ?? okMessage}
    </p>
  );
}
