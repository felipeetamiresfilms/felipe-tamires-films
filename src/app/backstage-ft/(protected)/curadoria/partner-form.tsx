"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { SubmitButton } from "@/components/backstage/SubmitButton";
import {
  FieldError,
  FormError,
  fieldClass,
  ghostButtonClass,
  labelClass,
  subtleButtonClass,
} from "@/components/backstage/form-ui";
import { CATEGORY_NAME_MAX } from "@/lib/admin/partner-category";
import { createPartnerCategoryAction } from "./actions";
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

  // Categorias: lista local para a recém-criada aparecer (e ficar selecionada)
  // sem recarregar a página nem perder o que já foi digitado no formulário.
  const [options, setOptions] = useState(categories);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryMessage, setCategoryMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [categoryPending, startCategoryTransition] = useTransition();

  function closeCategoryCreator() {
    setCreatingCategory(false);
    setNewCategoryName("");
    setCategoryMessage(null);
  }

  function submitNewCategory() {
    if (categoryPending) return;
    startCategoryTransition(async () => {
      try {
        const result = await createPartnerCategoryAction(newCategoryName);
        if (!result.ok) {
          setCategoryMessage({ kind: "error", text: result.error });
          return;
        }
        setOptions((prev) => [...prev, result.category]);
        setCategoryId(result.category.id);
        setCreatingCategory(false);
        setNewCategoryName("");
        setCategoryMessage({
          kind: "ok",
          text: `Categoria “${result.category.name}” criada e selecionada.`,
        });
      } catch {
        setCategoryMessage({
          kind: "error",
          text: "Não foi possível criar a categoria. Tente novamente.",
        });
      }
    });
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

      <div className="flex flex-col gap-2">
        <label className={labelClass}>
          Categoria *
          <select
            name="categoryId"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              {options.length === 0
                ? "Nenhuma categoria — crie uma abaixo"
                : "Selecione uma categoria"}
            </option>
            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.status === "inactive" ? " (inativa)" : ""}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.categoryId} />
        </label>

        {creatingCategory ? (
          <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface/60 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                autoFocus
                aria-label="Nome da nova categoria"
                placeholder="Ex.: DJ"
                maxLength={CATEGORY_NAME_MAX}
                value={newCategoryName}
                disabled={categoryPending}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  // Enter aqui NÃO pode enviar o formulário do parceiro.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitNewCategory();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeCategoryCreator();
                  }
                }}
                className={`${fieldClass} sm:flex-1`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitNewCategory}
                  disabled={categoryPending}
                  className={subtleButtonClass}
                >
                  {categoryPending ? "Salvando…" : "Criar"}
                </button>
                <button
                  type="button"
                  onClick={closeCategoryCreator}
                  disabled={categoryPending}
                  className={subtleButtonClass}
                >
                  Cancelar
                </button>
              </div>
            </div>
            {categoryMessage?.kind === "error" ? (
              <FieldError message={categoryMessage.text} />
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCategoryMessage(null);
              setCreatingCategory(true);
            }}
            className="self-start text-xs tracking-[0.08em] text-bone-dim underline-offset-4 transition-colors hover:text-bone hover:underline"
          >
            + Nova categoria
          </button>
        )}
        {categoryMessage?.kind === "ok" ? (
          <span role="status" className="text-xs text-bone-dim">
            {categoryMessage.text}
          </span>
        ) : null}
      </div>

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
