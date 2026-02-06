import { describe, expect, it } from "vitest";
import { enterprisePolicy, assertEnterprisePolicyInvariant } from "@hermes/domain";
import { generatePolicyReport } from "@hermes/domain";
import type { HermesResponse, HonestyWindowItem } from "@hermes/domain";
import { HermesService } from "./hermes.service";
import { SessionStore } from "./session-store";
import { AuditLogStore } from "./audit-log";
import { DiscoveryCache } from "./discovery-cache";
import { TraceStore } from "./trace-store";
import { SeedCatalogAdapter } from "@hermes/seed";
import { validateEnterprisePolicyOnStartup } from "./policy-validation";

function createService() {
  return new HermesService(
    new SessionStore(),
    new AuditLogStore(),
    new DiscoveryCache(),
    new SeedCatalogAdapter(),
    new TraceStore()
  );
}

function buildCandidate(id: string): HonestyWindowItem {
  return {
    productId: id,
    name: "Sample",
    price: 10,
    currency: "USD",
    whatsDifferent: "Different in size.",
    whyItMatters: "This affects fit.",
    whoItsBetterFor: "Fits people who want compact size."
  };
}

describe("Hermes enterprise policy", () => {
  it("rejects altered policy at startup", () => {
    const altered = {
      ...enterprisePolicy,
      maxOptions: 4
    } as unknown as typeof enterprisePolicy;

    expect(() => validateEnterprisePolicyOnStartup(altered)).toThrowError();
    expect(() => assertEnterprisePolicyInvariant(altered)).toThrowError();
  });

  it("throws on policy violations at runtime", () => {
    const service = createService();
    const response = {
      sessionId: "session-1",
      storeId: "store-outdoor",
      mode: "EXPLORATORY",
      state: "HONESTY_RENDER",
      statusText: "We're narrowing options so you get the right product.",
      auditTrailId: "session-1",
      candidates: [
        buildCandidate("sku-1"),
        buildCandidate("sku-2"),
        buildCandidate("sku-3"),
        buildCandidate("sku-4")
      ],
      recommendationIntent: true
    } as unknown as HermesResponse;

    const assertPolicy = (service as unknown as {
      assertPolicyResponse: (response: HermesResponse) => void;
    }).assertPolicyResponse;

    expect(() => assertPolicy(response)).toThrowError();
  });

  it("reports policy enforcement details", () => {
    const report = generatePolicyReport();

    expect(report.policy).toEqual(enterprisePolicy);
    expect(report.enforcementPoints).toEqual([
      "startup_policy_validation: apps/api/src/main.ts",
      "response_option_cap: apps/api/src/hermes/hermes.service.ts",
      "response_field_guard: apps/api/src/hermes/hermes.service.ts"
    ]);
    expect(report.invariantTests).toEqual([
      "packages/rules/src/hermes.invariants.test.ts",
      "apps/api/src/hermes/hermes.policy.test.ts",
      "apps/api/src/hermes/hermes.service.test.ts"
    ]);
  });
});
