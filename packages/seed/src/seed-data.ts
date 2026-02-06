import type { Product } from "@hermes/domain";
import meaningfulVariation from "../data/meaningful-variation.json";
import cosmeticOnly from "../data/cosmetic-only.json";
import expectationRepair from "../data/expectation-repair.json";

export const seedProducts: Product[] = [
  ...(meaningfulVariation as Product[]),
  ...(cosmeticOnly as Product[]),
  ...(expectationRepair as Product[])
];

export const seedStores = [
  "store-outdoor",
  "store-stationery",
  "store-audio"
];
