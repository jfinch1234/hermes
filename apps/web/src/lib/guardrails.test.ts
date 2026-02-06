import { describe, expect, it } from "vitest";
import { validateClientLanguage } from "./guardrails";
import type { HermesResponse } from "@hermes/domain";

const baseResponse: HermesResponse = {
  sessionId: "s1",
  storeId: "store-outdoor",
  mode: "EXPLORATORY",
  state: "HONESTY_RENDER",
  statusText: "We’re narrowing options so you get the right product.",
  auditTrailId: "s1",
  candidates: [
    {
      productId: "p1",
      name: "Sample",
      price: 10,
      currency: "USD",
      whatsDifferent: "capacity: 500 versus 750",
      whyItMatters: "Compared to the other options, this has capacity: 500.",
      whoItsBetterFor: "Better for people who want capacity like 500."
    }
  ]
};

describe("client guardrails", () => {
  it("allows neutral language", () => {
    expect(() => validateClientLanguage(baseResponse)).not.toThrow();
  });

  it("rejects forbidden language", () => {
    expect(() =>
      validateClientLanguage({
        ...baseResponse,
        candidates: [
          {
            ...baseResponse.candidates![0],
            whatsDifferent: "best option"
          }
        ]
      })
    ).toThrowError(/Forbidden language/);
  });
});
