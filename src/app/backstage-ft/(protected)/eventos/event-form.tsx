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
import { eventTypeLabels } from "@/lib/labels";

type EventInitial = {
  clientId: string;
  title: string;
  eventType: string;
  eventDate: string;
  location: string;
  description: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  clients: { id: string; displayName: string }[];
  submitLabel: string;
  cancelHref: string;
  eventId?: string;
  initial?: EventInitial;
};

export function EventForm({
  action,
  clients,
  submitLabel,
  cancelHref,
  eventId,
  initial,
}: Props) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  if (clients.length === 0) {
    return (
      <div className="flex max-w-lg flex-col items-start gap-4 rounded-xl border border-hairline bg-surface p-6">
        <p className="text-sm text-bone-dim">
          Cadastre um cliente antes de criar um evento.
        </p>
        <Link href="/backstage-ft/clientes/novo" className={ghostButtonClass}>
          + Novo cliente
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      {eventId ? <input type="hidden" name="id" value={eventId} /> : null}

      <label className={labelClass}>
        Cliente *
        <select
          name="clientId"
          required
          defaultValue={initial?.clientId ?? ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione um cliente
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.displayName}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.clientId} />
      </label>

      <label className={labelClass}>
        Título do evento *
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={initial?.title ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.title} />
      </label>

      <label className={labelClass}>
        Tipo *
        <select
          name="eventType"
          required
          defaultValue={initial?.eventType ?? ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione o tipo
          </option>
          {Object.entries(eventTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.eventType} />
      </label>

      <label className={labelClass}>
        Data
        <input
          name="eventDate"
          type="date"
          defaultValue={initial?.eventDate ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.eventDate} />
      </label>

      <label className={labelClass}>
        Local
        <input
          name="location"
          maxLength={160}
          defaultValue={initial?.location ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.location} />
      </label>

      <label className={labelClass}>
        Descrição
        <textarea
          name="description"
          rows={4}
          maxLength={4000}
          defaultValue={initial?.description ?? ""}
          className={`${fieldClass} resize-y`}
        />
        <FieldError message={state.fieldErrors?.description} />
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
