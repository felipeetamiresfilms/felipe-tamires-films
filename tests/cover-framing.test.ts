import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_COVER_ZOOM,
  coverFramingVars,
  parseCoverFraming,
} from "@/lib/cover-framing";

const valid = {
  desktop: { x: 40, y: 20, zoom: 1.3 },
  mobile: { x: 55.555, y: 10, zoom: 1 },
};

test("aceita a forma esperada e arredonda", () => {
  assert.deepEqual(parseCoverFraming(valid), {
    desktop: { x: 40, y: 20, zoom: 1.3 },
    mobile: { x: 55.56, y: 10, zoom: 1 },
  });
});

test("traz valores fora da faixa para dentro dela (sem áreas vazias)", () => {
  const parsed = parseCoverFraming({
    desktop: { x: -20, y: 140, zoom: 0.4 },
    mobile: { x: 50, y: 50, zoom: 99 },
  });
  assert.deepEqual(parsed?.desktop, { x: 0, y: 100, zoom: 1 });
  assert.equal(parsed?.mobile.zoom, MAX_COVER_ZOOM);
});

test("rejeita formas inválidas ou com chaves extras", () => {
  for (const raw of [
    null,
    "x",
    [],
    { desktop: valid.desktop },
    { ...valid, extra: 1 },
    { ...valid, mobile: { ...valid.mobile, evil: "x" } },
    { ...valid, mobile: { x: "50", y: 50, zoom: 1 } },
    { ...valid, mobile: { x: Number.NaN, y: 50, zoom: 1 } },
    { ...valid, mobile: { x: 50, y: 50, zoom: Infinity } },
  ]) {
    assert.equal(parseCoverFraming(raw), null, JSON.stringify(raw));
  }
});

test("gera as variáveis CSS de mobile e desktop", () => {
  assert.deepEqual(coverFramingVars(parseCoverFraming(valid)!), {
    "--cf-xm": "55.56%",
    "--cf-ym": "10%",
    "--cf-zm": "1",
    "--cf-xd": "40%",
    "--cf-yd": "20%",
    "--cf-zd": "1.3",
  });
});
