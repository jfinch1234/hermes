import { describe, expect, it } from "vitest";
import { SeedCatalogAdapter } from "./seedCatalogAdapter";

const baseProduct = {
  id: "sku-1",
  storeId: "store-a",
  name: "Alpha",
  price: 10,
  currency: "USD",
  attributes: { category: "test", currency: "USD" }
};

describe("SeedCatalogAdapter", () => {
  it("throws on mixed store ids", () => {
    const adapter = new SeedCatalogAdapter([
      baseProduct,
      {
        ...baseProduct,
        id: "sku-2",
        storeId: "store-b"
      }
    ]);

    expect(() => adapter.getByIds("store-a", ["sku-2"]))
      .toThrowError(/multiple stores/);
  });

  it("never returns more than the sample cap", () => {
    const adapter = new SeedCatalogAdapter([
      baseProduct,
      { ...baseProduct, id: "sku-2" }
    ]);

    expect(() => adapter.getSample("store-a", "", 60))
      .toThrowError(/Sample limit/);
    expect(adapter.getSample("store-a", "", 50).length)
      .toBeLessThanOrEqual(50);
  });

  it("preserves input order without mutation", () => {
    const source = [
      baseProduct,
      { ...baseProduct, id: "sku-2", name: "Beta" }
    ];
    const snapshot = JSON.parse(JSON.stringify(source));
    const adapter = new SeedCatalogAdapter(source);

    const sample = adapter.getSample("store-a", "", 50);

    expect(source).toEqual(snapshot);
    expect(sample.map((item) => item.sku_id)).toEqual(["sku-1", "sku-2"]);
  });
});
