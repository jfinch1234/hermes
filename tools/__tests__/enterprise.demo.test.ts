import { describe, expect, it } from "vitest";
import { assertNoForbiddenLanguage } from "@hermes/rules";
import { enterprisePolicy } from "@hermes/domain";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runEnterpriseDemo } from "../enterprise-demo.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function collectTexts(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTexts(item));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .flatMap((entry) => collectTexts(entry));
  }
  return [];
}

describe("enterprise demo runner", () => {
  it("runs deterministically", async () => {
    const first = await runEnterpriseDemo({ writeFiles: false });
    const second = await runEnterpriseDemo({ writeFiles: false });
    expect(JSON.stringify(first.data)).toBe(JSON.stringify(second.data));
  });

  it("includes policy report and respects guarantees", async () => {
    const result = await runEnterpriseDemo({ writeFiles: true });

    expect(result.data.policyReport).toBeDefined();
    expect(result.data.policyReport.policy).toEqual(enterprisePolicy);

    const jsonText = JSON.stringify(result.data);
    expect(() => assertNoForbiddenLanguage([jsonText])).not.toThrow();

    for (const scenario of result.data.scenarios) {
      for (const response of scenario.responses) {
        expect(response.storeId).toBe(scenario.storeId);
        expect(response.candidates?.length ?? 0).toBeLessThanOrEqual(
          enterprisePolicy.maxOptions
        );
        expect(response.clarification?.options.length ?? 0).toBeLessThanOrEqual(
          enterprisePolicy.maxOptions
        );
      }
      const traceStoreIds = scenario.trace.map((event: { store_id?: string }) =>
        event.store_id
      );
      expect(
        traceStoreIds.every((storeId: string | undefined) =>
          storeId === scenario.storeId
        )
      ).toBe(true);
    }

    const mdText = await readFile(result.mdPath, "utf8");
    expect(() => assertNoForbiddenLanguage([mdText])).not.toThrow();
  });

  it("writes demo files to disk", async () => {
    const result = await runEnterpriseDemo({ writeFiles: true });
    const jsonPath = path.join(root, "demos", "enterprise-demo.json");
    const mdPath = path.join(root, "demos", "enterprise-demo.md");
    const jsonText = await readFile(jsonPath, "utf8");
    const mdText = await readFile(mdPath, "utf8");

    expect(jsonPath).toBe(result.jsonPath);
    expect(mdPath).toBe(result.mdPath);
    expect(jsonText.length).toBeGreaterThan(0);
    expect(mdText.length).toBeGreaterThan(0);

    const jsonData = JSON.parse(jsonText);
    const texts = collectTexts(jsonData);
    expect(() => assertNoForbiddenLanguage(texts)).not.toThrow();
  });
});
