"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormError } from "@/components/backstage/form-ui";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/admin/form";

type DeleteAction = (
  state: FormState,
  formData: FormData,
) => Promise<FormState>;

const CONFIRM_WORD = "EXCLUIR";

/**
 * "Zona de perigo" da página do cliente (Etapas 9 e 10).
 *
 *  - Cliente sem eventos  -> confirmação simples (checkbox), exclusão só da
 *    linha do cliente.
 *  - Cliente com eventos  -> exclusão destrutiva do acervo: mostra a
 *    contagem real e exige digitar "EXCLUIR" (checado também no servidor).
 */
export function ClientDangerZone({
  clientId,
  eventCount,
  videoCount,
  deleteAction,
}: {
  clientId: string;
  eventCount: number;
  videoCount: number;
  deleteAction: DeleteAction;
}) {
  const [state, formAction] = useActionState(deleteAction, EMPTY_FORM_STATE);

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-xl border border-red-500/25 bg-surface p-6">
      <h2 className="text-xs uppercase tracking-[0.28em] text-red-400/80">
        Zona de perigo
      </h2>

      {eventCount > 0 ? (
        <DestructiveDelete
          clientId={clientId}
          eventCount={eventCount}
          videoCount={videoCount}
          formAction={formAction}
          error={state.error}
        />
      ) : (
        <SimpleDelete
          clientId={clientId}
          formAction={formAction}
          error={state.error}
        />
      )}
    </div>
  );
}

function SimpleDelete({
  clientId,
  formAction,
  error,
}: {
  clientId: string;
  formAction: (formData: FormData) => void;
  error?: string;
}) {
  return (
    <>
      <p className="text-sm text-bone-dim">
        Esta ação remove definitivamente este cliente. Como ele não tem eventos
        vinculados, nenhum acervo é afetado.
      </p>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={clientId} />
        <label className="flex items-start gap-2 text-xs text-bone-dim">
          <input
            type="checkbox"
            name="confirm"
            value="on"
            required
            className="mt-0.5 size-4 shrink-0 accent-red-500"
          />
          Tem certeza que deseja excluir este cliente? Esta ação não pode ser
          desfeita.
        </label>
        <div>
          <DeleteButton label="Excluir cliente" pendingLabel="Excluindo…" />
        </div>
        <FormError message={error} />
      </form>
    </>
  );
}

function DestructiveDelete({
  clientId,
  eventCount,
  videoCount,
  formAction,
  error,
}: {
  clientId: string;
  eventCount: number;
  videoCount: number;
  formAction: (formData: FormData) => void;
  error?: string;
}) {
  const [typed, setTyped] = useState("");
  const ready = typed.trim() === CONFIRM_WORD;
  const eventLabel = eventCount === 1 ? "evento" : "eventos";
  const videoLabel = videoCount === 1 ? "vídeo" : "vídeos";

  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-red-300">
        Excluir cliente e todo o acervo
      </p>
      <p className="text-sm text-bone-dim">
        Este cliente possui conteúdo vinculado. A exclusão removerá
        permanentemente o cliente, {eventCount} {eventLabel} e {videoCount}{" "}
        {videoLabel} cadastrados, além das capas e dos acessos privados
        (/meus-filmes e links de /assistir). Vídeos hospedados fora (YouTube
        etc.) não são apagados no provedor — só o registro no sistema.
      </p>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={clientId} />
        <label className="flex flex-col gap-2 text-xs text-bone-dim">
          <span>
            Digite <span className="font-semibold text-bone">EXCLUIR</span> para
            confirmar.
          </span>
          <input
            type="text"
            name="confirm"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Digite EXCLUIR para confirmar"
            className="w-full max-w-[16rem] rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-bone outline-none transition-colors focus:border-red-500/60"
          />
        </label>
        <div>
          <DeleteButton
            label="Excluir cliente e todo o acervo"
            pendingLabel="Excluindo…"
            disabled={!ready}
          />
        </div>
        <FormError message={error} />
      </form>
    </>
  );
}

function DeleteButton({
  label,
  pendingLabel,
  disabled = false,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex min-h-9 items-center justify-center rounded-full border border-red-500/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
