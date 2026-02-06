import { enterprisePolicy } from "./enterprisePolicy";

export interface PolicyReport {
  policy: typeof enterprisePolicy;
  enforcementPoints: string[];
  invariantTests: string[];
}

export function generatePolicyReport(): PolicyReport {
  return {
    policy: enterprisePolicy,
    enforcementPoints: [
      "startup_policy_validation: apps/api/src/main.ts",
      "response_option_cap: apps/api/src/hermes/hermes.service.ts",
      "response_field_guard: apps/api/src/hermes/hermes.service.ts"
    ],
    invariantTests: [
      "packages/rules/src/hermes.invariants.test.ts",
      "apps/api/src/hermes/hermes.policy.test.ts",
      "apps/api/src/hermes/hermes.service.test.ts"
    ]
  };
}
