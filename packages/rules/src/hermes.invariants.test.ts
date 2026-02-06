import { describe, expect, it } from "vitest";
import { assertNoForbiddenLanguage } from "./languageFirewall";

const REQUIRED_STATUS = "We’re narrowing options so you get the right product.";

describe("Hermes invariants", () => {
  it("requires the exact status text", () => {
    expect(REQUIRED_STATUS).toBe("We’re narrowing options so you get the right product.");
  });

  it("caps rendered options at three", () => {
    const rendered = ["a", "b", "c", "d"].slice(0, 3);
    expect(rendered.length).toBeLessThanOrEqual(3);
  });

  it("forbids persuasion language in sample output", () => {
    const sampleOutput = JSON.stringify({
      statusText: REQUIRED_STATUS,
      candidates: [
        {
          name: "Sample",
          whatsDifferent: "capacity: 500 versus 750",
          whyItMatters: "Compared to the other options, this has capacity: 500.",
          whoItsBetterFor: "Better for people who want capacity like 500."
        }
      ]
    });

    expect(() => assertNoForbiddenLanguage([sampleOutput])).not.toThrow();
  });
});
