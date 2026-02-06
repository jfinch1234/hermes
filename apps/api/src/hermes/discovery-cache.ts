import type { ProductFact, StoreId } from "@hermes/domain";

interface CacheEntry {
  products: ProductFact[];
  cachedAt: number;
}

export class DiscoveryCache {
  private cache = new Map<string, CacheEntry>();
  private ttlMs = 5 * 60 * 1000;

  get(storeId: StoreId, normalizedQuery: string): ProductFact[] | undefined {
    const key = `${storeId}:${normalizedQuery}`;
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.products;
  }

  set(storeId: StoreId, normalizedQuery: string, products: ProductFact[]): void {
    const key = `${storeId}:${normalizedQuery}`;
    this.cache.set(key, { products, cachedAt: Date.now() });
  }
}
