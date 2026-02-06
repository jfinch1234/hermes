import { describe, expect, it } from "vitest";
import { assertNoForbiddenLanguage, detectMeaningfulVariation } from "../index";
import type { ProductFact } from "@hermes/domain";

describe("language firewall", () => {
  it("rejects forbidden language", () => {
    expect(() => assertNoForbiddenLanguage(["best option"]))
      .toThrowError(/Forbidden language/);
  });

  it("accepts neutral language", () => {
    expect(() => assertNoForbiddenLanguage(["Differences are subtle."]))
      .not.toThrow();
  });
});

describe("variation detection", () => {
  it("ignores cosmetic differences", () => {
    const products: ProductFact[] = [
      {
        sku_id: "p1",
        store_id: "s1",
        title: "Notebook",
        price: 12,
        category: "notebooks",
        attributes: { color: "red", pages: 80, currency: "USD" }
      },
      {
        sku_id: "p2",
        store_id: "s1",
        title: "Notebook",
        price: 12,
        category: "notebooks",
        attributes: { color: "blue", pages: 80, currency: "USD" }
      }
    ];

    const variation = detectMeaningfulVariation(products);
    expect(variation.size).toBe(0);
  });
});
