export type StoreId = string;
export type SessionId = string;

export type DecisionMode = "EXPLORATORY";

import type { HermesState } from "./hermesState";

export type AttributeValue = string | number | boolean | string[] | number[];
export type ProductAttributes = Record<string, AttributeValue>;

export interface Product {
  id: string;
  storeId: StoreId;
  name: string;
  price: number;
  currency: string;
  attributes: ProductAttributes;
}

export interface ClarificationQuestion {
  attributeKey: string;
  question: string;
  options: string[];
}

export interface HonestyWindowItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  whatsDifferent: string;
  whyItMatters: string;
  whoItsBetterFor: string;
  differencesNote?: string;
  variationNote?: string;
}

export interface HermesResponse {
  sessionId: SessionId;
  storeId: StoreId;
  mode: DecisionMode;
  state: HermesState;
  statusText: string;
  clarification?: ClarificationQuestion;
  candidates?: HonestyWindowItem[];
  auditTrailId: string;
}

export interface HermesSession {
  id: SessionId;
  storeId: StoreId;
  mode: DecisionMode;
  state: HermesState;
  lastQuery?: string;
  clarification?: {
    attributeKey: string;
    selectedOption?: string;
    asked: boolean;
  };
  repairCount: number;
  repairClarificationLoop?: number;
}
