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
import { videoCategoryLabels, videoProviderLabels } from "@/lib/labels";

type VideoInitial = {
  title: string;
  description: string;
  category: string;
  provider: string;
  sourceUrl: string;
  embedUrl: string;
  downloadUrl: string;
  thumbnailUrl: string;
  durationInput: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  eventId: string;
  videoId?: string;
  submitLabel: string;
  cancelHref: string;
  initial?: VideoInitial;
};

export function VideoForm({
  action,
  eventId,
  videoId,
  submitLabel,
  cancelHref,
  initial,
}: Props) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      <input type="hidden" name="eventId" value={eventId} />
      {videoId ? <input type="hidden" name="videoId" value={videoId} /> : null}

      <label className={labelClass}>
        Título *
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
        Descrição
        <textarea
          name="description"
          rows={3}
          maxLength={4000}
          defaultValue={initial?.description ?? ""}
          className={`${fieldClass} resize-y`}
        />
        <FieldError message={state.fieldErrors?.description} />
      </label>

      <label className={labelClass}>
        Categoria *
        <select
          name="category"
          required
          defaultValue={initial?.category ?? ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione a categoria
          </option>
          {Object.entries(videoCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.category} />
      </label>

      <label className={labelClass}>
        Provedor *
        <select
          name="provider"
          required
          defaultValue={initial?.provider ?? "youtube"}
          className={fieldClass}
        >
          {Object.entries(videoProviderLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.provider} />
      </label>

      <label className={labelClass}>
        URL do vídeo (YouTube)
        <input
          name="sourceUrl"
          inputMode="url"
          maxLength={600}
          placeholder="https://www.youtube.com/watch?v=..."
          defaultValue={initial?.sourceUrl ?? ""}
          className={fieldClass}
        />
        <span className="text-xs font-normal normal-case tracking-normal text-bone-dim/80">
          Aceita watch, youtu.be ou embed. O ID é extraído e o embed é
          padronizado no servidor.
        </span>
        <FieldError message={state.fieldErrors?.sourceUrl} />
      </label>

      <label className={labelClass}>
        URL de incorporação (outros provedores)
        <input
          name="embedUrl"
          inputMode="url"
          maxLength={600}
          placeholder="https://..."
          defaultValue={initial?.embedUrl ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.embedUrl} />
      </label>

      <label className={labelClass}>
        URL de download
        <input
          name="downloadUrl"
          inputMode="url"
          maxLength={600}
          defaultValue={initial?.downloadUrl ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.downloadUrl} />
      </label>

      <label className={labelClass}>
        URL da miniatura
        <input
          name="thumbnailUrl"
          inputMode="url"
          maxLength={600}
          defaultValue={initial?.thumbnailUrl ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.thumbnailUrl} />
      </label>

      <label className={labelClass}>
        Duração
        <input
          name="durationInput"
          maxLength={16}
          placeholder="12:35"
          defaultValue={initial?.durationInput ?? ""}
          className={fieldClass}
        />
        <span className="text-xs font-normal normal-case tracking-normal text-bone-dim/80">
          Formato mm:ss ou h:mm:ss. Convertida para segundos no servidor.
        </span>
        <FieldError message={state.fieldErrors?.durationInput} />
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
