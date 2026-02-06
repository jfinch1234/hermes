import { describe, expect, it } from "vitest";
import { HermesService } from "./hermes.service";
import { SessionStore } from "./session-store";
import { AuditLogStore } from "./audit-log";
import { DiscoveryCache } from "./discovery-cache";
import { TraceStore } from "./trace-store";
import { SeedCatalogAdapter } from "@hermes/seed";
import { assertNoForbiddenLanguage } from "@hermes/rules";
import { assertValidTransition } from "@hermes/domain";
import type { HermesResponse } from "@hermes/domain";
import { abuseVectors, repairLoopVectors } from "./fixtures/abuse-vectors";

function createService() {
  return new HermesService(
    new SessionStore(),
    new AuditLogStore(),
    new DiscoveryCache(),
    new SeedCatalogAdapter(),
    new TraceStore()
  );
}

function collectResponseTexts(response: HermesResponse): string[] {
  const texts: string[] = [response.statusText];
  if (response.clarification) {
    texts.push(response.clarification.question, ...response.clarification.options);
  }
  if (response.candidates) {
    for (const candidate of response.candidates) {
      texts.push(
        candidate.name,
        candidate.whatsDifferent,
        candidate.whyItMatters,
        candidate.whoItsBetterFor
      );
      if (candidate.differencesNote) {
        texts.push(candidate.differencesNote);
      }
      if (candidate.variationNote) {
        texts.push(candidate.variationNote);
      }
    }
  }
  return texts;
}

function assertSafeResponse(service: HermesService, sessionId: string, storeId: string) {
  const proof = service.getProof(sessionId);
  expect(proof.store_id).toBe(storeId);
  expect(proof.trace.every((event) => event.store_id === storeId)).toBe(true);

  const audit = service.getAudit(sessionId);
  for (const event of audit) {
    if (event.from !== undefined) {
      const from = event.from;
      const to = event.to;
      expect(() => assertValidTransition(from, to)).not.toThrow();
    }
  }
}

function validateResponseBasics(response: HermesResponse, storeId: string) {
  expect(response.storeId).toBe(storeId);
  expect(response.candidates?.length ?? 0).toBeLessThanOrEqual(3);
  expect(response.clarification?.options.length ?? 0).toBeLessThanOrEqual(3);

  const hasClarification = Boolean(response.clarification);
  const hasCandidates = Boolean(response.candidates && response.candidates.length > 0);
  expect(hasClarification || hasCandidates).toBe(true);

  const texts = collectResponseTexts(response);
  expect(() => assertNoForbiddenLanguage(texts)).not.toThrow();
}

describe("Hermes abuse resilience", () => {
  it("redirects abusive intent to safe exploration", () => {
    for (const vector of abuseVectors) {
      const service = createService();
      const storeId = "store-outdoor";
      const session = service.createSession(storeId);
      const response = service.search(session.sessionId, vector.query, storeId);

      validateResponseBasics(response, storeId);
      assertSafeResponse(service, session.sessionId, storeId);
    }
  });

  it("keeps repair loop abuse safe", () => {
    for (const vector of repairLoopVectors) {
      const service = createService();
      const storeId = "store-outdoor";
      const session = service.createSession(storeId);
      service.search(session.sessionId, "bottle", storeId);
      service.expectationRepair(session.sessionId, vector.note);

      const response = service.search(session.sessionId, vector.query, storeId);

      validateResponseBasics(response, storeId);
      assertSafeResponse(service, session.sessionId, storeId);
    }
  });

  it("ignores abuse intent in repair notes", () => {
    const service = createService();
    const storeId = "store-outdoor";
    const session = service.createSession(storeId);
    service.search(session.sessionId, "bottle", storeId);

    const repaired = service.expectationRepair(session.sessionId, "Which is the best one?");

    validateResponseBasics(repaired, storeId);
    assertSafeResponse(service, session.sessionId, storeId);
  });
});
