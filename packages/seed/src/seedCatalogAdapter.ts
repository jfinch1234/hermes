import type {
  CatalogAdapter,
  Product,
  ProductFact,
  ProductSample,
  StoreId
} from "@hermes/domain";
import { assertStoreMatch } from "@hermes/domain";
import { seedProducts } from "./seed-data";

const MAX_SAMPLE_SIZE = 50;

function mapToFact(product: Product): ProductFact {
  return {
    sku_id: product.id,
    store_id: product.storeId,
    title: product.name,
    price: product.price,
    category: String(product.attributes.category ?? "unknown"),
    attributes: {
      ...product.attributes,
      currency: typeof product.attributes.currency === "string"
        ? product.attributes.currency
        : product.currency
    }
  };
}

export class SeedCatalogAdapter implements CatalogAdapter {
  private facts: ProductFact[];

  constructor(source = seedProducts) {
    this.facts = source.map(mapToFact);
  }

  getSample(store_id: StoreId, normalized_query: string, limit: number): ProductSample[] {
    if (limit > MAX_SAMPLE_SIZE) {
      throw new Error(`Sample limit exceeds ${MAX_SAMPLE_SIZE}`);
    }

    const query = normalized_query.trim();
    const matches = this.facts.filter((fact) => {
      if (fact.store_id !== store_id) {
        return false;
      }
      if (!query) {
        return true;
      }
      return fact.title.toLowerCase().includes(query);
    });

    const sample = matches.slice(0, limit);
    assertStoreMatch(store_id, sample);
    return sample;
  }

  getByIds(store_id: StoreId, sku_ids: string[]): ProductFact[] {
    const mismatched = this.facts.find(
      (fact) => fact.store_id !== store_id && sku_ids.includes(fact.sku_id)
    );
    if (mismatched) {
      throw new Error("Adapter returned data from multiple stores");
    }

    const found = this.facts.filter(
      (fact) => fact.store_id === store_id && sku_ids.includes(fact.sku_id)
    );
    assertStoreMatch(store_id, found);
    return found;
  }
}
