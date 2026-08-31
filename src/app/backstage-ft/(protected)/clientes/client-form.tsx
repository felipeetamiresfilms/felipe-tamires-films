"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/backstage/SubmitButton";
import {
  FieldError,
  FormError,
  fieldClass,
  ghostButtonClass,
  labelClass,
} from "@/components/backstage/form-ui";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/admin/form";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  cancelHref: string;
  clientId?: string;
  initial?: { displayName: string; email: string; phone: string };
};

export function ClientForm({
  action,
  submitLabel,
  cancelHref,
  clientId,
  initial,
}: Props) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      {clientId ? <input type="hidden" name="id" value={clientId} /> : null}

      <label className={labelClass}>
        Nome / Nome do casal *
        <input
          name="displayName"
          defaultValue={initial?.displayName ?? ""}
          required
          maxLength={120}
          autoComplete="off"
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.displayName} />
      </label>

      <label className={labelClass}>
        E-mail
        <input
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          maxLength={200}
          autoComplete="off"
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.email} />
      </label>

      <label className={labelClass}>
        Telefone
        <input
          name="phone"
          type="tel"
          defaultValue={initial?.phone ?? ""}
          maxLength={40}
          autoComplete="off"
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.phone} />
      </label>

      <FormError message={state.error} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className={ghostButtonClass}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
