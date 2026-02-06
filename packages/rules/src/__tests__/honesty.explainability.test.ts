import { describe, expect, it } from "vitest";
import type { ProductFact } from "@hermes/domain";
import { assertNoForbiddenLanguage } from "../languageFirewall";
import { buildHonestyWindow } from "../honesty";

const products: ProductFact[] = [
  {
    sku_id: "p1",
    store_id: "store-a",
    title: "Bottle A",
    price: 20,
    category: "outdoor",
    attributes: { capacity: 500, currency: "USD" }
  },
  {
    sku_id: "p2",
    store_id: "store-a",
    title: "Bottle B",
    price: 24,
    category: "outdoor",
    attributes: { capacity: 750, currency: "USD" }
  }
];

describe("honesty explainability", () => {
  it("requires all explanation sections for each option", () => {
    const windows = buildHonestyWindow(products);

    for (const window of windows) {
      expect(window.whatsDifferent.length).toBeGreaterThan(0);
      expect(window.whyItMatters.length).toBeGreaterThan(0);
      expect(window.whoItsBetterFor.length).toBeGreaterThan(0);
    }
  });

  it("keeps explanation structure consistent across options", () => {
    const windows = buildHonestyWindow(products);
    const base = windows[0];

    for (const window of windows) {
      expect(window.whatsDifferent.length).toBe(base.whatsDifferent.length);
      expect(window.whyItMatters.length).toBe(base.whyItMatters.length);
      expect(window.whoItsBetterFor.length).toBe(base.whoItsBetterFor.length);
    }
  });

  it("avoids evaluative language", () => {
    const windows = buildHonestyWindow(products);
    const texts = windows.flatMap((window) => [
      ...window.whatsDifferent,
      ...window.whyItMatters,
      ...window.whoItsBetterFor
    ]);

    expect(() => assertNoForbiddenLanguage(texts)).not.toThrow();
  });
});
