"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadBackstageAccess } from "@/lib/admin/auth";
import {
  GENERIC_SAVE_ERROR,
  SESSION_EXPIRED_ERROR,
  zodFieldErrors,
  type FormState,
  type PortalFormState,
} from "@/lib/admin/form";
import { clientInputSchema, isUuid } from "@/lib/admin/validation";
import {
  insertClient,
  setClientPortalEnabled,
  setClientPortalToken,
  updateClient,
} from "@/lib/admin/mutations";
import { getClientPortalState } from "@/lib/admin/queries";
import { generatePortalToken, hashPortalToken } from "@/lib/client-portal";

function readClientForm(formData: FormData) {
  return clientInputSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
}

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  let newId: string;
  try {
    ({ id: newId } = await insertClient(parsed.data));
  } catch (err) {
    console.error("createClientAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/clientes/${newId}?ok=cliente-criado`);
}

export async function updateClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return { ok: false, error: "Cliente inválido." };
  }

  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    await updateClient(id, parsed.data);
  } catch (err) {
    console.error("updateClientAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/clientes/${id}?ok=cliente-atualizado`);
}

// --- Portal do cliente (Etapa 8) --------------------------------------

/**
 * Cria OU regenera o acesso do cliente. Gera um token forte, grava só o
 * hash e liga o portal; devolve o token EM MEMÓRIA (via `useActionState`)
 * para o admin copiar UMA vez — nada é redirecionado nem persistido em
 * texto puro. Regenerar (já existe hash) exige o checkbox `confirm`.
 */
export async function issueClientPortalAction(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return { ok: false, error: "Cliente inválido." };
  }

  let state;
  try {
    state = await getClientPortalState(id);
  } catch (err) {
    console.error("issueClientPortalAction/state", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  if (state.created && formData.get("confirm") !== "on") {
    return {
      ok: false,
      error: "Confirme a operação — o link atual deixará de funcionar na hora.",
    };
  }

  const token = generatePortalToken();
  try {
    await setClientPortalToken(id, hashPortalToken(token));
  } catch (err) {
    console.error("issueClientPortalAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  return { ok: true, token };
}

export async function disableClientPortalAction(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return { ok: false, error: "Cliente inválido." };
  }

  try {
    await setClientPortalEnabled(id, false);
  } catch (err) {
    console.error("disableClientPortalAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  return { ok: true };
}
