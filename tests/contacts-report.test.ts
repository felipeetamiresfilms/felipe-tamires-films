import { test } from "node:test";
import assert from "node:assert/strict";
import { contactRate, parseContacts } from "@/lib/intelligence/contacts-report";
import type { GaReport } from "@/lib/intelligence/ga-data";

const row = (dims: string[], mets: number[]) => ({
  dimensionValues: dims.map((value) => ({ value })),
  metricValues: mets.map((m) => ({ value: String(m) })),
});

const base = {
  period: 30 as const,
  total: undefined,
  bySource: undefined,
  byPage: undefined,
  byCampaign: undefined,
  byButton: null,
  fetchedAt: "2026-10-22T12:00:00.000Z",
};

test("taxa de contato nunca divide por zero", () => {
  assert.equal(contactRate(0, 0), null);
  assert.equal(contactRate(3, 0), null);
  assert.equal(contactRate(1, 4), 0.25);
});

test("período sem dados: zeros reais, taxa e origem ausentes", () => {
  const data = parseContacts({ ...base, total: { rows: [] }, bySource: {} });
  assert.equal(data.clicks, 0);
  assert.equal(data.contactSessions, 0);
  assert.equal(data.totalSessions, 0);
  assert.equal(data.contactRate, null);
  assert.equal(data.topSource, null);
  assert.equal(data.bySource.length, 6);
  assert.ok(data.bySource.every((r) => r.clicks === 0 && r.sessions === 0));
  assert.deepEqual(data.byPage, []);
  assert.deepEqual(data.byButton, { status: "unavailable" });
});

test("sessões e eventos não se confundem", () => {
  const bySource: GaReport = {
    rows: [
      row(["instagram.com"], [5, 1]), // muitos cliques, 1 sessão
      row(["google"], [2, 2]),
    ],
    totals: [row([], [7, 3])],
  };
  const data = parseContacts({ ...base, total: { rows: [row([], [100])] }, bySource });
  assert.equal(data.clicks, 7);
  assert.equal(data.contactSessions, 3);
  assert.equal(data.totalSessions, 100);
  assert.equal(data.contactRate, 0.03); // sessões / sessões — não 7/100
  // Principal origem = mais SESSÕES com contato, não mais cliques.
  assert.deepEqual(data.topSource, { label: "Google", sessions: 2 });
});

test("totais vêm do GA4 (TOTAL), não da soma das linhas exibidas", () => {
  const bySource: GaReport = { rows: [row(["google"], [2, 2])], totals: [row([], [9, 6])] };
  const data = parseContacts({ ...base, bySource });
  assert.equal(data.clicks, 9);
  assert.equal(data.contactSessions, 6);
});

test("relatórios de página, campanha e botão", () => {
  const data = parseContacts({
    ...base,
    byPage: { rows: [row(["/pacotes"], [4, 3])] },
    byCampaign: { rows: [row(["lancamento", "instagram / social"], [2, 1])] },
    byButton: { rows: [row(["pacotes_memoria"], [4])] },
  });
  assert.deepEqual(data.byPage, [{ label: "/pacotes", clicks: 4, sessions: 3 }]);
  assert.deepEqual(data.byCampaign, [
    { label: "lancamento", sourceMedium: "instagram / social", clicks: 2, sessions: 1 },
  ]);
  assert.deepEqual(data.byButton, { status: "ok", rows: [{ location: "pacotes_memoria", clicks: 4 }] });
});
