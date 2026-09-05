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
import { publishStatusLabels } from "@/lib/labels";

type PartnerInitial = {
  categoryId: string;
  name: string;
  shortDescription: string;
  description: string;
  recommendationText: string;
  location: string;
  whatsappNumber: string;
  instagramUrl: string;
  websiteUrl: string;
  videoSourceUrl: string;
  featured: boolean;
  sortOrder: string;
  status: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: { id: string; name: string; status: string }[];
  submitLabel: string;
  cancelHref: string;
  partnerId?: string;
  initial?: PartnerInitial;
};

export function PartnerForm({
  action,
  categories,
  submitLabel,
  cancelHref,
  partnerId,
  initial,
}: Props) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  if (categories.length === 0) {
    return (
      <div className="flex max-w-lg flex-col items-start gap-4 rounded-xl border border-hairline bg-surface p-6">
        <p className="text-sm text-bone-dim">
          Nenhuma categoria cadastrada ainda. Cadastre uma categoria (via SQL
          Editor do Supabase, tabela <code>partner_categories</code>) antes de
          criar um parceiro.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      {partnerId ? <input type="hidden" name="id" value={partnerId} /> : null}

      <label className={labelClass}>
        Nome *
        <input
          name="name"
          required
          maxLength={160}
          defaultValue={initial?.name ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.name} />
      </label>

      <label className={labelClass}>
        Categoria *
        <select
          name="categoryId"
          required
          defaultValue={initial?.categoryId ?? ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.status === "inactive" ? " (inativa)" : ""}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.categoryId} />
      </label>

      <label className={labelClass}>
        Descrição curta
        <input
          name="shortDescription"
          maxLength={240}
          defaultValue={initial?.shortDescription ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.shortDescription} />
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

      <label className={labelClass}>
        Por que indicamos
        <textarea
          name="recommendationText"
          rows={4}
          maxLength={2000}
          defaultValue={initial?.recommendationText ?? ""}
          className={`${fieldClass} resize-y`}
        />
        <FieldError message={state.fieldErrors?.recommendationText} />
        <span className="text-xs font-normal normal-case tracking-normal text-bone-dim/70">
          Recomendação editorial da Felipe &amp; Tamires — aparece em destaque
          na página pública do parceiro.
        </span>
      </label>

      <label className={labelClass}>
        Localização
        <input
          name="location"
          maxLength={160}
          defaultValue={initial?.location ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.location} />
      </label>

      <label className={labelClass}>
        WhatsApp
        <input
          name="whatsappNumber"
          inputMode="numeric"
          placeholder="5554999999999"
          defaultValue={initial?.whatsappNumber ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.whatsappNumber} />
        <span className="text-xs font-normal normal-case tracking-normal text-bone-dim/70">
          Só números, com DDI e DDD. É contato direto com o parceiro — não o
          WhatsApp da Felipe &amp; Tamires.
        </span>
      </label>

      <label className={labelClass}>
        Instagram
        <input
          name="instagramUrl"
          type="url"
          placeholder="https://instagram.com/..."
          defaultValue={initial?.instagramUrl ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.instagramUrl} />
      </label>

      <label className={labelClass}>
        Site
        <input
          name="websiteUrl"
          type="url"
          placeholder="https://..."
          defaultValue={initial?.websiteUrl ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.websiteUrl} />
      </label>

      <label className={labelClass}>
        Vídeo do YouTube
        <input
          name="videoSourceUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          defaultValue={initial?.videoSourceUrl ?? ""}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.videoSourceUrl} />
      </label>

      <label className="flex items-center gap-3 text-sm text-bone">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initial?.featured ?? false}
          className="size-4 shrink-0 accent-brass"
        />
        Destacar na home (Nossa Curadoria)
      </label>

      <label className={labelClass}>
        Ordem
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={100000}
          defaultValue={initial?.sortOrder ?? "0"}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.sortOrder} />
      </label>

      <label className={labelClass}>
        Status *
        <select
          name="status"
          required
          defaultValue={initial?.status ?? "draft"}
          className={fieldClass}
        >
          {Object.entries(publishStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.status} />
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
