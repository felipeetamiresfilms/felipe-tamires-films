// Carregado com `node --import ./tests/register.mjs --test`: deixa o Node
// (que já remove tipos de .ts nativamente) resolver imports do jeito do
// projeto — alias "@/" e caminhos sem extensão. Sem dependências.
import { register } from "node:module";

register("./resolve-hooks.mjs", import.meta.url);
