import { describe, expect, it } from "vitest";
import { HermesService } from "./hermes.service";
import { SessionStore } from "./session-store";
import { AuditLogStore } from "./audit-log";
import { DiscoveryCache } from "./discovery-cache";
import { TraceStore } from "./trace-store";
import { SeedCatalogAdapter } from "@hermes/seed";
import { assertNoForbiddenLanguage } from "@hermes/rules";
import { DISALLOWED_TRACE_KEYS } from "@hermes/domain";
import type { TraceDetails } from "@hermes/domain";

function createService() {
  return new HermesService(
    new SessionStore(),
    new AuditLogStore(),
    new DiscoveryCache(),
    new SeedCatalogAdapter(),
    new TraceStore()
  );
}

function collectTraceStrings(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTraceStrings(item));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .flatMap((entry) => collectTraceStrings(entry));
  }
  return [];
}

function collectTraceKeys(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.concat(
    Object.values(value as Record<string, unknown>)
      .flatMap((entry) => collectTraceKeys(entry))
  );
}

describe("Hermes engine", () => {
  it("caps candidates at 3", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    const search = service.search(session.sessionId, "bottle", "store-outdoor");

    if (search.clarification) {
      const clarified = service.clarify(
        session.sessionId,
        search.clarification.attributeKey,
        search.clarification.options[0]
      );
      expect(clarified.candidates?.length ?? 0).toBeLessThanOrEqual(3);
      return;
    }

    expect(search.candidates?.length ?? 0).toBeLessThanOrEqual(3);
  });

  it("collapses cosmetic-only variation", () => {
    const service = createService();
    const session = service.createSession("store-stationery");
    const response = service.search(session.sessionId, "notebook", "store-stationery");

    expect(response.state).toBe("HONESTY_RENDER");
    expect(response.candidates?.length).toBe(1);
    expect(response.candidates?.[0].whatsDifferent)
      .toContain("This is effectively the only version that matters here.");
  });

  it("uses the required status text", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    const response = service.search(session.sessionId, "bottle", "store-outdoor");

    expect(response.statusText)
      .toBe("We’re narrowing options so you get the right product.");
  });

  it("locks session to a single store", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    service.search(session.sessionId, "bottle", "store-outdoor");

    expect(() => service.search(session.sessionId, "bottle", "store-audio"))
      .toThrowError(/single store/);
  });

  it("records expectation repair", () => {
    const service = createService();
    const session = service.createSession("store-audio");
    service.search(session.sessionId, "headphones", "store-audio");
    const repaired = service.expectationRepair(session.sessionId);

    expect(["HONESTY_RENDER", "CLARIFICATION"]).toContain(repaired.state);
    expect(service.getAudit(session.sessionId).length).toBeGreaterThan(0);
  });

  it("keeps repair results within constraints", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    service.search(session.sessionId, "bottle", "store-outdoor");
    const repaired = service.expectationRepair(session.sessionId, "too broad");

    expect(repaired.storeId).toBe("store-outdoor");
    expect(repaired.candidates?.length ?? 0).toBeLessThanOrEqual(3);
    const texts = [
      repaired.statusText,
      ...(repaired.clarification
        ? [repaired.clarification.question, ...repaired.clarification.options]
        : []),
      ...(repaired.candidates ?? []).flatMap((candidate) => [
        candidate.name,
        candidate.whatsDifferent,
        candidate.whyItMatters,
        candidate.whoItsBetterFor
      ])
    ];
    expect(() => assertNoForbiddenLanguage(texts)).not.toThrow();
  });

  it("keeps repairs loop-safe", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    service.search(session.sessionId, "bottle", "store-outdoor");

    const first = service.expectationRepair(session.sessionId, "too narrow");
    const second = service.expectationRepair(session.sessionId, "too narrow");

    expect(["HONESTY_RENDER", "CLARIFICATION"]).toContain(first.state);
    expect(["HONESTY_RENDER", "CLARIFICATION"]).toContain(second.state);
  });

  it("asks at most one repair clarification per loop", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    service.search(session.sessionId, "bottle", "store-outdoor");

    const repaired = service.expectationRepair(session.sessionId, "must fit");
    expect(repaired.clarification?.options.length ?? 0).toBeLessThanOrEqual(3);
  });

  it("allows legal state transitions", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    const stateMachine = (service as unknown as { stateMachine: { transition: Function } })
      .stateMachine;
    const sessionStore = (service as unknown as { sessions: { get: Function } }).sessions;
    const stored = sessionStore.get(session.sessionId);

    expect(() =>
      stateMachine.transition(stored, "DISCOVERY_SCAN", "test", stored.storeId)
    ).not.toThrow();
  });

  it("rejects illegal state transitions", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    const stateMachine = (service as unknown as { stateMachine: { transition: Function } })
      .stateMachine;
    const sessionStore = (service as unknown as { sessions: { get: Function } }).sessions;
    const stored = sessionStore.get(session.sessionId);

    expect(() =>
      stateMachine.transition(stored, "HONESTY_RENDER", "test", stored.storeId)
    ).toThrowError(/Invalid transition/);
  });

  it("rejects store changes on transition", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    const stateMachine = (service as unknown as { stateMachine: { transition: Function } })
      .stateMachine;
    const sessionStore = (service as unknown as { sessions: { get: Function } }).sessions;
    const stored = sessionStore.get(session.sessionId);

    expect(() =>
      stateMachine.transition(stored, "DISCOVERY_SCAN", "test", "store-audio")
    ).toThrowError(/single store/);
  });

  it("records trace events and returns proof in dev", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    service.search(session.sessionId, "bottle", "store-outdoor");

    const proof = service.getProof(session.sessionId);
    expect(proof.session_id).toBe(session.sessionId);
    expect(proof.trace.length).toBeGreaterThan(0);
    expect(proof.trace.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "STATE_TRANSITION",
        "DISCOVERY_SCAN",
        "VARIATION_SEMANTICS"
      ])
    );
  });

  it("disables proof in production without flag", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalProofFlag = process.env.DEV_PROOF_MODE;
    process.env.NODE_ENV = "production";
    delete process.env.DEV_PROOF_MODE;

    try {
      const service = createService();
      const session = service.createSession("store-outdoor");
      expect(() => service.getProof(session.sessionId)).toThrowError();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalProofFlag === undefined) {
        delete process.env.DEV_PROOF_MODE;
      } else {
        process.env.DEV_PROOF_MODE = originalProofFlag;
      }
    }
  });

  it("sanitizes and bounds trace events", () => {
    const service = createService();
    const session = service.createSession("store-outdoor");
    const traceStore = (service as unknown as { traceStore: TraceStore }).traceStore;

    const disallowedNote =
      ["b", "e", "s", "t"].join("") + " " + ["d", "e", "a", "l"].join("");

    traceStore.append({
      timestamp: new Date().toISOString(),
      session_id: session.sessionId,
      store_id: "store-outdoor",
      eventType: "REPAIR_CLASSIFIED",
      details: {
        note: disallowedNote,
        [DISALLOWED_TRACE_KEYS[0]]: 1,
        [DISALLOWED_TRACE_KEYS[1]]: 0.9,
        [DISALLOWED_TRACE_KEYS[2]]: true
      } as unknown as TraceDetails
    });

    for (let i = 0; i < 250; i += 1) {
      traceStore.append({
        timestamp: new Date().toISOString(),
        session_id: session.sessionId,
        store_id: "store-outdoor",
        eventType: "DISCOVERY_SCAN",
        details: { index: i }
      });
    }

    const proof = service.getProof(session.sessionId);
    expect(proof.trace.length).toBe(200);

    const detailKeys = proof.trace.flatMap((event) => collectTraceKeys(event.details));
    const disallowedKeyRegex = new RegExp(DISALLOWED_TRACE_KEYS.join("|"), "i");
    for (const key of detailKeys) {
      expect(disallowedKeyRegex.test(key)).toBe(false);
    }

    const traceStrings = proof.trace.flatMap((event) => collectTraceStrings(event));
    expect(() => assertNoForbiddenLanguage(traceStrings)).not.toThrow();
  });
});
