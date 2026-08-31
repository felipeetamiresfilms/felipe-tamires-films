"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadBackstageAccess } from "@/lib/admin/auth";
import {
  GENERIC_SAVE_ERROR,
  SESSION_EXPIRED_ERROR,
  zodFieldErrors,
  type FormState,
} from "@/lib/admin/form";
import { clientInputSchema, isUuid } from "@/lib/admin/validation";
import { insertClient, updateClient } from "@/lib/admin/mutations";

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
