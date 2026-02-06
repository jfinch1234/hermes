import type { StoreId } from "./types";
import type { ProductFact, ProductSample } from "./productFact";

// Adapters must return raw facts without preference shaping or ordering guarantees.
export interface CatalogAdapter {
  getSample(store_id: StoreId, normalized_query: string, limit: number): ProductSample[];
  getByIds(store_id: StoreId, sku_ids: string[]): ProductFact[];
}

export function assertStoreMatch(storeId: StoreId, facts: ProductFact[]): void {
  for (const fact of facts) {
    if (fact.store_id !== storeId) {
      throw new Error("Adapter returned data from multiple stores");
    }
  }
}
