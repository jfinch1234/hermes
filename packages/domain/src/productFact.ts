import type { ProductAttributes, StoreId } from "./types";

export interface ProductFact {
  sku_id: string;
  store_id: StoreId;
  title: string;
  price: number;
  category: string;
  attributes: ProductAttributes;
  variant_family_id?: string;
  quality_flags?: string[];
}

export type ProductSample = ProductFact;
