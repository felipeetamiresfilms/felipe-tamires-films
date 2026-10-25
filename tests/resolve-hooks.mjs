import { existsSync } from "node:fs";

const SRC = new URL("../src/", import.meta.url);

// O projeto é ESM em .ts sem "type": "module": declara o formato aqui para o
// Node não tentar CommonJS primeiro.
async function asTypeScript(promise) {
  const result = await promise;
  return result.url.endsWith(".ts") ? { ...result, format: "module-typescript" } : result;
}

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith("@/")) spec = new URL(spec.slice(2), SRC).href;
  const isPath = spec.startsWith("file:") || spec.startsWith(".") || spec.startsWith("/");
  if (isPath && !/\.[cm]?[jt]sx?$/.test(spec)) {
    const base = new URL(spec, context.parentURL).href;
    for (const ext of [".ts", "/index.ts"]) {
      const candidate = new URL(base + ext);
      if (existsSync(candidate)) return asTypeScript(next(candidate.href, context));
    }
  }
  return asTypeScript(next(spec, context));
}
