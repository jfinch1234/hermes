import type {
  ProductFact,
  HonestyWindowItem,
  AttributeValue,
  HonestyWindow
} from "@hermes/domain";
import { isMeaningfulVariation } from "./variation";

const attributeImpactMap: Record<string, string> = {
  size: "fit",
  weight: "portability",
  capacity: "how much it holds",
  insulation: "temperature retention",
  battery: "time between charges",
  material: "long-term wear",
  noiseControl: "sound reduction",
  layout: "how information is organized",
  flowRate: "delivery speed",
  grindLevels: "tuning range"
};

const subtleNote = "Differences are minor in this set.";
const noVariationNote = "This is effectively the only version that matters here.";

function extractCurrency(value: AttributeValue | undefined, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return fallback;
}

function collectMeaningfulKeys(products: ProductFact[]): string[] {
  const keys = new Set<string>();
  for (const product of products) {
    for (const key of Object.keys(product.attributes)) {
      if (isMeaningfulVariation(products, key)) {
        keys.add(key);
      }
    }
  }
  return Array.from(keys).sort();
}

function describeDifference(
  key: string,
  value: string,
  otherValues: string[]
): string {
  if (otherValues.length === 0) {
    return `${key}: ${value} in this set.`;
  }
  return `${key}: ${value} compared with ${otherValues.join(", ")}.`;
}

function describeImpact(key: string): string {
  const impact = attributeImpactMap[key] ?? "how it fits your daily use";
  return `This affects ${impact}.`;
}

function describeAudience(key: string, value: string): string {
  return `Fits people who want ${key} like ${value}.`;
}

export function buildHonestyWindow(products: ProductFact[]): HonestyWindow[] {
  if (products.length === 0) {
    return [];
  }

  const meaningfulKeys = collectMeaningfulKeys(products);
  const selectedKeys = meaningfulKeys.slice(0, 1);
  const differencesAreSubtle = meaningfulKeys.length <= 1;

  if (selectedKeys.length === 0) {
    return products.map(() => ({
      whatsDifferent: [noVariationNote, subtleNote],
      whyItMatters: ["There are no meaningful differences between these options."],
      whoItsBetterFor: ["Fits people who want a simple, consistent choice."]
    }));
  }

  return products.map((product) => {
    const whatsDifferent: string[] = [];
    const whyItMatters: string[] = [];
    const whoItsBetterFor: string[] = [];

    for (const key of selectedKeys) {
      const value = String(product.attributes[key] ?? "");
      const otherValues = products
        .map((candidate) => String(candidate.attributes[key] ?? ""))
        .filter((item) => item !== value);

      whatsDifferent.push(describeDifference(key, value, Array.from(new Set(otherValues))));
      whyItMatters.push(describeImpact(key));
      whoItsBetterFor.push(describeAudience(key, value));
    }

    if (differencesAreSubtle) {
      whatsDifferent.push(subtleNote);
    }

    return {
      whatsDifferent,
      whyItMatters,
      whoItsBetterFor
    };
  });
}

export function buildHonestyWindowItems(products: ProductFact[]): HonestyWindowItem[] {
  const windows = buildHonestyWindow(products);

  return products.map((product, index) => {
    const window = windows[index];
    return {
      productId: product.sku_id,
      name: product.title,
      price: product.price,
      currency: extractCurrency(product.attributes.currency, "USD"),
      whatsDifferent: window.whatsDifferent.join(" "),
      whyItMatters: window.whyItMatters.join(" "),
      whoItsBetterFor: window.whoItsBetterFor.join(" ")
    };
  });
}
