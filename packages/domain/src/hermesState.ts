export const hermesStates = [
  "SEARCH_INTAKE",
  "DISCOVERY_SCAN",
  "VARIATION_DETECTION",
  "CLARIFICATION",
  "CANDIDATE_PRUNING",
  "HONESTY_RENDER",
  "EXPECTATION_REPAIR"
] as const;

export type HermesState = (typeof hermesStates)[number];

export const hermesTransitions: Record<HermesState, HermesState[]> = {
  SEARCH_INTAKE: ["DISCOVERY_SCAN", "EXPECTATION_REPAIR"],
  DISCOVERY_SCAN: ["VARIATION_DETECTION", "SEARCH_INTAKE", "EXPECTATION_REPAIR"],
  VARIATION_DETECTION: [
    "CLARIFICATION",
    "CANDIDATE_PRUNING",
    "SEARCH_INTAKE",
    "EXPECTATION_REPAIR"
  ],
  CLARIFICATION: ["CANDIDATE_PRUNING", "SEARCH_INTAKE", "EXPECTATION_REPAIR"],
  CANDIDATE_PRUNING: ["HONESTY_RENDER", "SEARCH_INTAKE", "EXPECTATION_REPAIR"],
  HONESTY_RENDER: ["EXPECTATION_REPAIR", "SEARCH_INTAKE"],
  EXPECTATION_REPAIR: ["SEARCH_INTAKE"]
};

export function assertValidTransition(current: HermesState, next: HermesState): void {
  const allowed = hermesTransitions[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid transition from ${current} to ${next}`);
  }
}
