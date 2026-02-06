import React from "react";
import { act, create } from "react-test-renderer";
import type { ReactTestRendererJSON } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HermesResponse } from "@hermes/domain";
import { forbiddenLanguage } from "@hermes/rules";

vi.mock("../src/lib/api", () => ({
  createSession: vi.fn(),
  runSearch: vi.fn(),
  runClarify: vi.fn(),
  runRepair: vi.fn()
}));

vi.mock("../src/lib/guardrails", () => ({
  validateClientLanguage: vi.fn()
}));

const baseSession: HermesResponse = {
  sessionId: "s1",
  storeId: "store-outdoor",
  mode: "EXPLORATORY",
  state: "HONESTY_RENDER",
  statusText: "Status: ready",
  auditTrailId: "audit-1",
  candidates: []
};

const makeCandidate = (index: number) => ({
  productId: `p${index}`,
  name: `Option ${index}`,
  price: 20 + index,
  currency: "USD",
  whatsDifferent: `difference ${index}`,
  whyItMatters: `reason ${index}`,
  whoItsBetterFor: `audience ${index}`
});

function collectText(
  node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null
): string {
  if (node === null) {
    return "";
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }
  if (typeof node === "string") {
    return node;
  }
  if (node.type === "style") {
    return "";
  }
  const children = node.children ?? [];
  return children.map(collectText).join(" ");
}

describe("reference page", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("caps options and always renders honesty window", async () => {
    const api = await import("../src/lib/api");
    vi.mocked(api.createSession).mockResolvedValue(baseSession);
    vi.mocked(api.runSearch).mockResolvedValue({
      ...baseSession,
      candidates: [1, 2, 3, 4].map(makeCandidate)
    });

    const { default: ReferencePage } = await import(
      "../src/app/reference/page"
    );

    const renderer = create(<ReferencePage />);

    const input = renderer.root.findByType("input");
    const searchButton = renderer.root.findByProps({
      "data-testid": "search-button"
    });

    await act(async () => {
      input.props.onChange({ target: { value: "camp mug" } });
    });

    await act(async () => {
      await searchButton.props.onClick();
    });

    const options = renderer.root.findAllByProps({
      "data-testid": "reference-option"
    });
    expect(options).toHaveLength(3);

    const honestyWindow = renderer.root.findAllByProps({
      "data-testid": "honesty-window"
    });
    expect(honestyWindow).toHaveLength(1);
  });

  it("avoids forbidden terms in output", async () => {
    const api = await import("../src/lib/api");
    vi.mocked(api.createSession).mockResolvedValue(baseSession);
    vi.mocked(api.runSearch).mockResolvedValue({
      ...baseSession,
      candidates: [1, 2, 3].map(makeCandidate)
    });

    const { default: ReferencePage } = await import(
      "../src/app/reference/page"
    );

    const renderer = create(<ReferencePage />);

    const input = renderer.root.findByType("input");
    const searchButton = renderer.root.findByProps({
      "data-testid": "search-button"
    });

    await act(async () => {
      input.props.onChange({ target: { value: "backpack" } });
    });

    await act(async () => {
      await searchButton.props.onClick();
    });

    const text = collectText(renderer.toJSON());
    const lowerText = text.toLowerCase();

    forbiddenLanguage.forEach((term: string) => {
      expect(lowerText).not.toContain(term);
    });
  });

  it("triggers repair and updates results", async () => {
    const api = await import("../src/lib/api");
    vi.mocked(api.createSession).mockResolvedValue(baseSession);
    vi.mocked(api.runSearch)
      .mockResolvedValueOnce({
        ...baseSession,
        candidates: [makeCandidate(1)]
      })
      .mockResolvedValueOnce({
        ...baseSession,
        candidates: [
          {
            ...makeCandidate(2),
            name: "Repaired Option"
          }
        ]
      });
    vi.mocked(api.runRepair).mockResolvedValue(baseSession);

    const { default: ReferencePage } = await import(
      "../src/app/reference/page"
    );

    const renderer = create(<ReferencePage />);
    const input = renderer.root.findByType("input");
    const searchButton = renderer.root.findByProps({
      "data-testid": "search-button"
    });

    await act(async () => {
      input.props.onChange({ target: { value: "stove" } });
    });

    await act(async () => {
      await searchButton.props.onClick();
    });

    const repairButton = renderer.root.findByProps({
      "data-testid": "repair-button"
    });

    await act(async () => {
      await repairButton.props.onClick();
    });

    expect(api.runRepair).toHaveBeenCalledTimes(1);

    const text = collectText(renderer.toJSON());
    expect(text).toContain("Repaired Option");
  });
});
