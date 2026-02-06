export interface EnterprisePolicy {
  readonly forbidRanking: true;
  readonly forbidRecommendations: true;
  readonly maxOptions: 3;
  readonly singleStoreOnly: true;
  readonly forbidPaidPlacement: true;
  readonly forbidOutcomeOptimization: true;
  readonly proofModeAllowedInProd: false;
}

export const enterprisePolicy: EnterprisePolicy = Object.freeze({
  forbidRanking: true,
  forbidRecommendations: true,
  maxOptions: 3,
  singleStoreOnly: true,
  forbidPaidPlacement: true,
  forbidOutcomeOptimization: true,
  proofModeAllowedInProd: false
});

export function assertEnterprisePolicyInvariant(policy: EnterprisePolicy): void {
  if (policy.forbidRanking !== true) {
    throw new Error("Enterprise policy violation: ordering guard disabled");
  }
  if (policy.forbidRecommendations !== true) {
    throw new Error("Enterprise policy violation: guidance guard disabled");
  }
  if (policy.maxOptions !== 3) {
    throw new Error("Enterprise policy violation: option cap mismatch");
  }
  if (policy.singleStoreOnly !== true) {
    throw new Error("Enterprise policy violation: store scope mismatch");
  }
  if (policy.forbidPaidPlacement !== true) {
    throw new Error("Enterprise policy violation: paid placement guard disabled");
  }
  if (policy.forbidOutcomeOptimization !== true) {
    throw new Error("Enterprise policy violation: outcome guard disabled");
  }
  if (policy.proofModeAllowedInProd !== false) {
    throw new Error("Enterprise policy violation: proof mode guard mismatch");
  }
}
