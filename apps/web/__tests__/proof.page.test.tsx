import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  }
}));

const baseProof = {
  session_id: "session-1",
  store_id: "store-outdoor",
  normalized_query_hash: "hash-1",
  trace: [
    {
      timestamp: "2026-02-06T00:00:00Z",
      eventType: "STATE_TRANSITION",
      store_id: "store-outdoor",
      details: { reason: "session_created" }
    }
  ],
  honesty_window: [
    {
      productId: "sku-1",
      name: "Sample Bottle",
      price: 25,
      currency: "USD",
      whatsDifferent: "capacity: 12 compared with 16.",
      whyItMatters: "This affects how much it holds.",
      whoItsBetterFor: "Fits people who want a compact option."
    }
  ]
};

describe("proof page", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => baseProof
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("renders in non-prod", async () => {
    const { default: ProofPage } = await import(
      "../src/app/proof/[sessionId]/page"
    );

    const element = await ProofPage({ params: { sessionId: "session-1" } });
    const html = renderToStaticMarkup(element as ReactElement);

    expect(html).toContain("Session ID: session-1");
    expect(html).toContain("Sample Bottle");
  });

  it("returns 404 in prod", async () => {
    process.env.NODE_ENV = "production";
    const { default: ProofPage } = await import(
      "../src/app/proof/[sessionId]/page"
    );

    await expect(
      ProofPage({ params: { sessionId: "session-1" } })
    ).rejects.toThrowError("NOT_FOUND");
  });

  it("renders no inputs or buttons and includes honesty window content", async () => {
    const { default: ProofPage } = await import(
      "../src/app/proof/[sessionId]/page"
    );

    const element = await ProofPage({ params: { sessionId: "session-1" } });
    const html = renderToStaticMarkup(element as ReactElement);

    expect(html).not.toContain("<button");
    expect(html).not.toContain("<input");
    expect(html).toContain("What is different");
    expect(html).toContain("capacity: 12 compared with 16.");
  });
});
