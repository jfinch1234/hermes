import { describe, expect, it } from "vitest";
import type { ProductFact } from "@hermes/domain";
import {
  detectMeaningfulVariation,
  deriveClarificationQuestion,
  isMeaningfulVariation
} from "../variation";

const baseProduct: ProductFact = {
  sku_id: "p1",
  store_id: "store-a",
  title: "Bottle",
  price: 12,
  category: "outdoor",
  attributes: {
    capacity: 500,
    color: "red",
    currency: "USD"
  }
};

describe("variation semantics", () => {
  it("does not treat cosmetic differences as meaningful", () => {
    const products: ProductFact[] = [
      baseProduct,
      {
        ...baseProduct,
        sku_id: "p2",
        attributes: { ...baseProduct.attributes, color: "blue" }
      }
    ];

    const variation = detectMeaningfulVariation(products);
    expect(variation.size).toBe(0);
  });

  it("treats functional differences as meaningful", () => {
    const products: ProductFact[] = [
      baseProduct,
      {
        ...baseProduct,
        sku_id: "p2",
        attributes: { ...baseProduct.attributes, capacity: 750 }
      }
    ];

    expect(isMeaningfulVariation(products, "capacity")).toBe(true);
    const variation = detectMeaningfulVariation(products);
    const question = deriveClarificationQuestion(variation);
    expect(question).toBeDefined();
  });

  it("ignores cosmetic-only attributes in mixed sets", () => {
    const products: ProductFact[] = [
      baseProduct,
      {
        ...baseProduct,
        sku_id: "p2",
        attributes: { ...baseProduct.attributes, capacity: 750, color: "blue" }
      }
    ];

    const variation = detectMeaningfulVariation(products);
    expect(Array.from(variation.keys())).toEqual(["capacity"]);
  });

  it("produces at most one clarification question", () => {
    const products: ProductFact[] = [
      baseProduct,
      {
        ...baseProduct,
        sku_id: "p2",
        attributes: { ...baseProduct.attributes, capacity: 750, weight: 200 }
      }
    ];

    const variation = detectMeaningfulVariation(products);
    const question = deriveClarificationQuestion(variation);
    expect(question).toBeDefined();
  });
});
