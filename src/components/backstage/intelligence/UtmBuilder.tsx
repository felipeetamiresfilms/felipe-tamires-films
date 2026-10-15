"use client";

import { useId, useState } from "react";
import {
  FieldError,
  fieldClass,
  labelClass,
  primaryButtonClass,
  subtleButtonClass,
} from "@/components/backstage/form-ui";
import {
  UTM_DESTINATIONS,
  UTM_PRESETS,
  buildUtmUrl,
  type UtmField,
  type UtmInput,
} from "@/lib/intelligence/utm";

/**
 * Gerador de links UTM. Tudo no navegador: nada é salvo, nada é enviado.
 * Destinos restritos às páginas comerciais públicas do domínio oficial.
 */

const CUSTOM = "__custom__";

export function UtmBuilder() {
  const [destinationChoice, setDestinationChoice] = useState(UTM_DESTINATIONS[0].path);
  const [customPath, setCustomPath] = useState("");
  const [values, setValues] = useState({ source: "", medium: "", campaign: "", content: "" });
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const ids = { dest: useId(), custom: useId(), status: useId() };

  const input: UtmInput = {
    destination: destinationChoice === CUSTOM ? customPath : destinationChoice,
    ...values,
  };
  const result = buildUtmUrl(input);
  const showErrors = touched;

  const set = (field: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setCopied(null);
  };

  async function copy() {
    setTouched(true);
    if (!result.url) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }

  const fieldError = (field: UtmField) =>
    showErrors ? <FieldError message={result.errors[field]} /> : null;

  const normalizedHint = (field: Exclude<UtmField, "destination">) => {
    const raw = values[field].trim();
    const norm = result.normalized[field];
    return raw && norm && raw !== norm ? (
      <span className="text-xs normal-case tracking-normal text-bone-dim">
        Será enviado como <code className="text-bone">{norm}</code>
      </span>
    ) : null;
  };

  const textField = (
    field: Exclude<UtmField, "destination">,
    label: string,
    placeholder: string,
    required = true,
  ) => (
    <label className={labelClass}>
      <span>
        {label} <code className="normal-case tracking-normal text-bone-dim/80">utm_{field}</code>
        {required ? null : <span className="normal-case tracking-normal text-bone-dim/80"> · opcional</span>}
      </span>
      <input
        className={fieldClass}
        value={values[field]}
        onChange={(e) => set(field, e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={showErrors && Boolean(result.errors[field])}
      />
      {fieldError(field)}
      {normalizedHint(field)}
    </label>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex flex-col gap-6 rounded-xl border border-hairline bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-bone-dim">Atalhos</p>
          <div className="flex flex-wrap gap-2">
            {UTM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={subtleButtonClass}
                onClick={() => {
                  setValues((v) => ({
                    ...v,
                    source: preset.source,
                    medium: preset.medium,
                    content: preset.content ?? v.content,
                  }));
                  setCopied(null);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className={labelClass} htmlFor={ids.dest}>
            Página de destino
          </label>
          <select
            id={ids.dest}
            className={fieldClass}
            value={destinationChoice}
            onChange={(e) => {
              setDestinationChoice(e.target.value);
              setCopied(null);
            }}
          >
            {UTM_DESTINATIONS.map((d) => (
              <option key={d.path} value={d.path}>
                {d.label} — {d.path}
              </option>
            ))}
            <option value={CUSTOM}>Outra página pública (ex.: um filme)…</option>
          </select>
          {destinationChoice === CUSTOM ? (
            <label className={labelClass} htmlFor={ids.custom}>
              <span>Caminho ou endereço da página</span>
              <input
                id={ids.custom}
                className={fieldClass}
                value={customPath}
                onChange={(e) => {
                  setCustomPath(e.target.value);
                  setCopied(null);
                }}
                onBlur={() => setTouched(true)}
                placeholder="/filmes/nome-do-filme"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={showErrors && Boolean(result.errors.destination)}
              />
            </label>
          ) : null}
          {fieldError("destination")}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {textField("source", "Origem", "instagram")}
          {textField("medium", "Meio", "social")}
          {textField("campaign", "Campanha", "casamentos_outubro")}
          {textField("content", "Conteúdo", "bio, stories, post…", false)}
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-bone-dim">Link gerado</p>
          <p
            className={`break-all rounded-lg border border-hairline bg-ink px-4 py-3 font-mono text-[13px] leading-relaxed ${
              result.url ? "text-bone" : "text-bone-dim"
            }`}
          >
            {result.url ?? "Preencha destino, origem, meio e campanha para gerar o link."}
          </p>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={copy}
            disabled={!result.url}
            aria-describedby={ids.status}
          >
            Copiar link
          </button>
          <p id={ids.status} role="status" className="min-h-5 text-xs text-bone-dim">
            {copied === "ok"
              ? "Link copiado."
              : copied === "fail"
                ? "Não foi possível copiar automaticamente — selecione o texto acima."
                : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-hairline p-5 text-sm leading-relaxed text-bone-dim sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-bone-dim">Convenções</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-brass/70">
            <li>Divulgação orgânica: meio <code className="text-bone">social</code>.</li>
            <li>Anúncios Meta: meio <code className="text-bone">paid_social</code>.</li>
            <li>Parceiros: meio <code className="text-bone">referral</code>, origem = nome do parceiro.</li>
            <li>Tudo em minúsculas, sem acentos e sem espaços.</li>
            <li>Nunca use nomes, telefones ou e-mails de clientes.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
