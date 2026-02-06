export type VariationSemantic =
  | "FUNCTIONAL"
  | "CONSTRAINT"
  | "OUTCOME"
  | "COSMETIC";

export const variationSemanticsMap: Record<string, VariationSemantic> = {
  capacity: "FUNCTIONAL",
  flowRate: "FUNCTIONAL",
  grindLevels: "FUNCTIONAL",
  layout: "FUNCTIONAL",
  noiseControl: "FUNCTIONAL",
  insulation: "OUTCOME",
  battery: "OUTCOME",
  material: "OUTCOME",
  durability: "OUTCOME",
  warranty: "OUTCOME",
  size: "CONSTRAINT",
  weight: "CONSTRAINT",
  compatibility: "CONSTRAINT",
  fit: "CONSTRAINT",
  color: "COSMETIC",
  packaging: "COSMETIC",
  branding: "COSMETIC",
  brand: "COSMETIC",
  finish: "COSMETIC",
  appearance: "COSMETIC",
  style: "COSMETIC",
  name: "COSMETIC",
  title: "COSMETIC"
};

export function getVariationSemantic(attributeKey: string): VariationSemantic {
  return variationSemanticsMap[attributeKey] ?? "FUNCTIONAL";
}
