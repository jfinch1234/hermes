import type {
  RepairIntent,
  HermesSession,
  ProductFact,
  ClarificationQuestion
} from "@hermes/domain";
import { classifyMismatch } from "@hermes/domain";
import { deriveClarificationQuestion, detectMeaningfulVariation } from "@hermes/rules";

export interface RepairPlan {
  intent: RepairIntent;
  action: string;
  normalizedQuery: string;
  clarification?: ClarificationQuestion;
  attributeKey?: string;
  selectedOption?: string;
}

const alternateQueryMap: Record<string, string> = {
  bottle: "flask",
  headphones: "headset",
  notebook: "journal"
};

function findAlternateQuery(note: string, fallback: string): string {
  const normalized = note.toLowerCase();
  for (const [key, value] of Object.entries(alternateQueryMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return fallback;
}

function chooseDominantAttribute(
  products: ProductFact[],
  variation: Map<string, string[]>
): { attributeKey?: string; selectedOption?: string } {
  const keys = Array.from(variation.keys()).sort();
  if (keys.length === 0) {
    return {};
  }

  const attributeKey = keys[0];
  const counts = new Map<string, number>();
  for (const product of products) {
    const value = String(product.attributes[attributeKey] ?? "");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const sortedValues = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] === a[1]) {
      return a[0].localeCompare(b[0]);
    }
    return b[1] - a[1];
  });

  return {
    attributeKey,
    selectedOption: sortedValues[0]?.[0]
  };
}

export function applyRepairPlan(params: {
  session: HermesSession;
  normalizedQuery: string;
  note?: string;
  products: ProductFact[];
  canAskClarification: boolean;
}): RepairPlan {
  const intent = classifyMismatch(params.note);
  const variation = detectMeaningfulVariation(params.products);

  switch (intent) {
    case "WRONG_CATEGORY":
      return {
        intent,
        action: "broaden_query",
        normalizedQuery: ""
      };
    case "TOO_BROAD": {
      const dominant = chooseDominantAttribute(params.products, variation);
      return {
        intent,
        action: dominant.attributeKey ? "narrow_by_attribute" : "resample",
        normalizedQuery: params.normalizedQuery,
        attributeKey: dominant.attributeKey,
        selectedOption: dominant.selectedOption
      };
    }
    case "TOO_NARROW":
      return {
        intent,
        action: "widen_candidates",
        normalizedQuery: params.normalizedQuery
      };
    case "MISSED_CONSTRAINT": {
      if (params.canAskClarification) {
        const clarification = deriveClarificationQuestion(variation);
        if (clarification) {
          return {
            intent,
            action: "repair_clarification",
            normalizedQuery: params.normalizedQuery,
            clarification
          };
        }
      }
      return {
        intent,
        action: "resample",
        normalizedQuery: params.normalizedQuery
      };
    }
    case "EXPECTED_DIFFERENT_TYPE":
      return {
        intent,
        action: "alternate_query",
        normalizedQuery: params.note
          ? findAlternateQuery(params.note, params.normalizedQuery)
          : params.normalizedQuery
      };
    case "UNKNOWN":
    default:
      return {
        intent: "UNKNOWN",
        action: "resample",
        normalizedQuery: params.normalizedQuery
      };
  }
}
