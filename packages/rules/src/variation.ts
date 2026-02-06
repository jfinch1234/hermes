import type {
  ProductFact,
  ClarificationQuestion,
  ProductAttributes,
  VariationSemantic
} from "@hermes/domain";
import { getVariationSemantic } from "@hermes/domain";

function toComparable(value: ProductAttributes[string]): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

export function isMeaningfulVariation(
  products: ProductFact[],
  attributeKey: string
): boolean {
  const semantic = getVariationSemantic(attributeKey);
  if (semantic === "COSMETIC") {
    return false;
  }

  const values = new Set<string>();
  for (const product of products) {
    if (product.attributes[attributeKey] === undefined) {
      continue;
    }
    values.add(toComparable(product.attributes[attributeKey]));
  }

  return values.size > 1;
}

export function detectMeaningfulVariation(products: ProductFact[]): Map<string, string[]> {
  const variations = new Map<string, Set<string>>();

  for (const product of products) {
    for (const [key, value] of Object.entries(product.attributes)) {
      const comparable = toComparable(value);
      if (!variations.has(key)) {
        variations.set(key, new Set());
      }
      variations.get(key)?.add(comparable);
    }
  }

  const meaningful = new Map<string, string[]>();
  for (const [key, values] of variations.entries()) {
    if (values.size > 1 && isMeaningfulVariation(products, key)) {
      meaningful.set(key, Array.from(values).sort());
    }
  }

  return meaningful;
}

function semanticLabel(semantic: VariationSemantic): string {
  switch (semantic) {
    case "FUNCTIONAL":
      return "functional";
    case "CONSTRAINT":
      return "compatibility";
    case "OUTCOME":
      return "outcome";
    case "COSMETIC":
      return "appearance";
    default:
      return "functional";
  }
}

export function deriveClarificationQuestion(
  variation: Map<string, string[]>
): ClarificationQuestion | undefined {
  if (variation.size === 0) {
    return undefined;
  }

  const entries = Array.from(variation.entries()).sort((a, b) => {
    if (b[1].length === a[1].length) {
      return a[0].localeCompare(b[0]);
    }
    return b[1].length - a[1].length;
  });

  const [attributeKey, options] = entries[0];

  const semantic = getVariationSemantic(attributeKey);

  return {
    attributeKey,
    question: `Which ${semanticLabel(semantic)} difference feels closer to what you want?`,
    options
  };
}
