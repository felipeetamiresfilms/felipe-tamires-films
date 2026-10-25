import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildContactClick,
  contactChannelOf,
  contactSlug,
  createContactClickHandler,
  type ContactClick,
  type ContactTarget,
} from "@/lib/analytics/contact";
import { isTrackedPath } from "@/lib/analytics/routes";

const FTF = "5554997006436";
const ftfLink = `https://wa.me/${FTF}?text=${encodeURIComponent("Olá, Felipe e Tamires! Sou a Maria.")}`;
const page = { page_path: "/pacotes", page_title: "Pacotes" };
const target: ContactTarget = { href: ftfLink, location: "pacotes_memoria", label: "Quero este pacote" };

function setup(over: { canSend?: boolean; target?: ContactTarget | null; page?: typeof page | null } = {}) {
  const sent: ContactClick[] = [];
  const handler = createContactClickHandler({
    canSend: () => over.canSend ?? true,
    findTarget: () => (over.target === undefined ? target : over.target),
    pageContext: () => (over.page === undefined ? page : over.page),
    send: (click) => sent.push(click),
    whatsappNumber: FTF,
  });
  let prevented = 0;
  let stopped = 0;
  const event = (button = 0) => ({
    button,
    target: null,
    preventDefault: () => prevented++,
    stopPropagation: () => stopped++,
    stopImmediatePropagation: () => stopped++,
  });
  return { handler, sent, event, interfered: () => prevented + stopped };
}

test("um clique dispara exatamente um evento, com os parâmetros esperados", () => {
  const { handler, sent, event } = setup();
  handler(event());
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], {
    contact_channel: "whatsapp",
    contact_location: "pacotes_memoria",
    contact_label: "quero_este_pacote",
    page_path: "/pacotes",
    page_title: "Pacotes",
  });
});

test("cliques seguidos geram um evento cada — sem duplicar", () => {
  const { handler, sent, event } = setup();
  handler(event(0));
  handler(event(1)); // botão do meio (auxclick)
  assert.equal(sent.length, 2);
});

test("sem consentimento (canSend falso) nada é enviado", () => {
  const { handler, sent, event } = setup({ canSend: false });
  handler(event());
  assert.equal(sent.length, 0);
});

test("a navegação para o WhatsApp não é bloqueada", () => {
  const { handler, event, interfered } = setup();
  handler(event());
  assert.equal(interfered(), 0);
  const blocked = setup({ canSend: false });
  blocked.handler(blocked.event());
  assert.equal(blocked.interfered(), 0);
});

test("ignora botão direito, links sem marcação e páginas fora da allowlist", () => {
  const right = setup();
  right.handler(right.event(2));
  assert.equal(right.sent.length, 0);
  const unmarked = setup({ target: null });
  unmarked.handler(unmarked.event());
  assert.equal(unmarked.sent.length, 0);
  const untracked = setup({ page: null });
  untracked.handler(untracked.event());
  assert.equal(untracked.sent.length, 0);
});

test("nenhum dado pessoal no payload (número, mensagem, nomes)", () => {
  const click = buildContactClick(target, page, FTF);
  const json = JSON.stringify(click);
  assert.ok(!json.includes(FTF));
  assert.ok(!/maria|olá|ola|text=|wa\.me/i.test(json));
  assert.deepEqual(Object.keys(click ?? {}).sort(), [
    "contact_channel",
    "contact_label",
    "contact_location",
    "page_path",
    "page_title",
  ]);
});

test("só canais da própria FTF contam", () => {
  assert.equal(contactChannelOf(ftfLink, FTF), "whatsapp");
  assert.equal(contactChannelOf(`https://api.whatsapp.com/send?phone=${FTF}`, FTF), "whatsapp");
  assert.equal(contactChannelOf("https://wa.me/5511999999999?text=oi", FTF), null); // parceiro
  assert.equal(contactChannelOf("mailto:contato@exemplo.com", FTF), "email");
  assert.equal(contactChannelOf("https://www.instagram.com/x", FTF), null);
  assert.equal(contactChannelOf("/pacotes", FTF), null);
});

test("rótulo ausente vira '(not set)' (não herda o clique anterior no GTM)", () => {
  const click = buildContactClick({ ...target, label: null }, page, FTF);
  assert.equal(click?.contact_label, "(not set)");
  assert.equal(buildContactClick({ ...target, location: "  " }, page, FTF), null);
});

test("slugs curtos e estáveis", () => {
  assert.equal(contactSlug("Quero o Experiência!"), "quero_o_experiencia");
  assert.equal(contactSlug("x".repeat(100)).length, 60);
});

test("rotas privadas continuam fora da medição", () => {
  for (const path of ["/backstage-ft/inteligencia", "/backstage-ft/login", "/assistir/abc", "/meus-filmes/tok", "/privacidade"]) {
    assert.equal(isTrackedPath(path), false, path);
  }
  for (const path of ["/", "/pacotes", "/filmes", "/filmes/casamento-ana"]) {
    assert.equal(isTrackedPath(path), true, path);
  }
});
