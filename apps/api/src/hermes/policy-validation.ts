import { enterprisePolicy, assertEnterprisePolicyInvariant } from "@hermes/domain";

export function validateEnterprisePolicyOnStartup(
  policy = enterprisePolicy
): void {
  assertEnterprisePolicyInvariant(policy);
}
