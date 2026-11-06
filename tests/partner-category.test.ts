import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORY_NAME_MAX,
  categoryKey,
  cleanCategoryName,
  findDuplicateCategory,
  validateCategoryName,
} from "@/lib/admin/partner-category";

test("cleanCategoryName remove espaços extras", () => {
  assert.equal(cleanCategoryName("   Bar   de  Drinks  "), "Bar de Drinks");
});

test("validateCategoryName aceita nome válido já limpo", () => {
  assert.deepEqual(validateCategoryName("  DJ "), { ok: true, name: "DJ" });
});

test("validateCategoryName rejeita vazio, só símbolos e longo demais", () => {
  assert.equal(validateCategoryName("   ").ok, false);
  assert.equal(validateCategoryName("!!! ---").ok, false);
  assert.equal(validateCategoryName("a".repeat(CATEGORY_NAME_MAX + 1)).ok, false);
  assert.equal(validateCategoryName("a".repeat(CATEGORY_NAME_MAX)).ok, true);
});

test("categoryKey ignora caixa, espaços e acentos", () => {
  assert.equal(categoryKey("  dj "), categoryKey("DJ"));
  assert.equal(categoryKey("Decoração"), categoryKey("decoracao"));
  assert.notEqual(categoryKey("DJ"), categoryKey("Drinks"));
});

test("findDuplicateCategory acha por nome normalizado ou por slug", () => {
  const existing = [
    { name: "Fotografia", slug: "fotografia" },
    { name: "Cerimonial & Assessoria", slug: "cerimonial-assessoria" },
  ];
  assert.equal(
    findDuplicateCategory(existing, "  FOTOGRAFIA ", "fotografia")?.name,
    "Fotografia",
  );
  assert.equal(
    findDuplicateCategory(existing, "Cerimonial-Assessoria", "cerimonial-assessoria")
      ?.name,
    "Cerimonial & Assessoria",
  );
  assert.equal(findDuplicateCategory(existing, "DJ", "dj"), undefined);
});
