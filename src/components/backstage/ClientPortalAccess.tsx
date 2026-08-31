"use client";

import { useActionState } from "react";
import { CopyLinkButton } from "@/components/backstage/CopyLinkButton";
import { SubmitButton } from "@/components/backstage/SubmitButton";
import { FormError } from "@/components/backstage/form-ui";
import {
  EMPTY_PORTAL_FORM_STATE,
  type PortalFormState,
} from "@/lib/admin/form";

type PortalAction = (
  state: PortalFormState,
  formData: FormData,
) => Promise<PortalFormState>;

/**
 * Seção "Acesso aos filmes" do cliente (Etapa 8).
 *
 * O link só aparece uma vez, logo após criar/regenerar: a ação devolve o
 * token puro apenas em memória (`useActionState`), nunca via URL nem banco.
 * Depois disso o painel mostra só o estado — o link não pode ser
 * reconstruído (guardamos só o hash). Perdeu? Gera um novo.
 */
export function ClientPortalAccess({
  clientId,
  created,
  enabled,
  issueAction,
  disableAction,
}: {
  clientId: string;
  created: boolean;
  enabled: boolean;
  issueAction: PortalAction;
  disableAction: PortalAction;
}) {
  const [issue, issueForm] = useActionState(
    issueAction,
    EMPTY_PORTAL_FORM_STATE,
  );
  const [disable, disableForm] = useActionState(
    disableAction,
    EMPTY_PORTAL_FORM_STATE,
  );

  const statusLabel = !created
    ? "Acesso ainda não criado."
    : enabled
      ? "Acesso ativo."
      : "Acesso desativado.";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-6">
      <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
        Acesso aos filmes
      </h2>
      <p className="text-sm text-bone-dim">
        {statusLabel}{" "}
        {created ? (
          <span className="text-bone-dim/70">
            Uma página com todos os filmes publicados deste cliente.
          </span>
        ) : (
          <span className="text-bone-dim/70">
            Cria um link privado permanente com todos os filmes publicados
            deste cliente — sem login.
          </span>
        )}
      </p>

      {issue.token ? (
        <div className="flex flex-col gap-3 rounded-lg border border-brass/40 bg-raised/60 p-4">
          <p className="text-sm text-brass-soft">
            Copie este link agora e envie ao cliente. Ele não fica guardado no
            sistema — não conseguiremos mostrá-lo de novo. Se precisar, gere um
            novo aqui (o anterior deixa de funcionar).
          </p>
          <CopyLinkButton path={`/meus-filmes/${issue.token}`} />
        </div>
      ) : null}

      {!created ? (
        <form action={issueForm} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={clientId} />
          <SubmitButton variant="subtle" pendingLabel="Criando…">
            Criar acesso do cliente
          </SubmitButton>
          <FormError message={issue.error} />
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <form
              action={issueForm}
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="id" value={clientId} />
              <label className="flex items-center gap-2 text-xs text-bone-dim">
                <input
                  type="checkbox"
                  name="confirm"
                  required
                  className="size-4 accent-brass"
                />
                Confirmo
              </label>
              <SubmitButton variant="subtle" pendingLabel="Gerando…">
                {enabled ? "Regenerar acesso" : "Gerar novo acesso"}
              </SubmitButton>
            </form>

            {enabled ? (
              <form action={disableForm}>
                <input type="hidden" name="id" value={clientId} />
                <SubmitButton variant="subtle" pendingLabel="Desativando…">
                  Desativar acesso
                </SubmitButton>
              </form>
            ) : null}
          </div>
          <FormError message={issue.error ?? disable.error} />
        </div>
      )}
    </div>
  );
}
