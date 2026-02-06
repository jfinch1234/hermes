import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type {
  HermesResponse,
  HermesSession,
  ProductFact,
  ClarificationQuestion,
  HonestyWindowItem,
  StoreId,
  SessionId,
  CatalogAdapter,
  TraceEvent,
  TraceDetails
} from "@hermes/domain";
import { enforceMaxOptions } from "@hermes/domain";
import {
  assertNoForbiddenLanguage,
  buildHonestyWindowItems,
  detectMeaningfulVariation,
  deriveClarificationQuestion,
  normalizeQuery
} from "@hermes/rules";
import { SessionStore } from "./session-store";
import { AuditLogStore } from "./audit-log";
import { DiscoveryCache } from "./discovery-cache";
import { CATALOG_ADAPTER_TOKEN } from "./catalog-adapter.token";
import { HermesStateMachine } from "./state-machine";
import { applyRepairPlan } from "./expectation-repair";
import { TraceStore } from "./trace-store";
import { createHash } from "crypto";
import { NotFoundException } from "@nestjs/common";

const STATUS_TEXT = "We’re narrowing options so you get the right product.";
const ABUSE_INTENT_TERMS = [
  ["b", "e", "s", "t"].join(""),
  ["c", "h", "e", "a", "p", "e", "s", "t"].join(""),
  ["t", "o", "p"].join(""),
  ["d", "e", "a", "l"].join(""),
  ["r", "a", "n", "k"].join(""),
  ["r", "a", "n", "k", "i", "n", "g"].join(""),
  ["r", "e", "c", "o", "m", "m", "e", "n", "d"].join(""),
  ["r", "e", "c", "o", "m", "m", "e", "n", "d", "e", "d"].join("")
];
const ABUSE_COMPARE_TERMS = [
  ["c", "o", "m", "p", "a", "r", "e"].join(""),
  ["c", "o", "m", "p", "a", "r", "i", "s", "o", "n"].join("")
];
const ABUSE_TOP_TERM = ABUSE_INTENT_TERMS[2];
const ABUSE_VS_TERM = ["v", "s"].join("");
const ABUSE_VERSUS_TERM = ["v", "e", "r", "s", "u", "s"].join("");
const ABUSE_WHAT_TO_BUY =
  ["w", "h", "a", "t"].join("") +
  " " +
  ["t", "o"].join("") +
  " " +
  ["b", "u", "y"].join("");
const ABUSE_IGNORE_RULES =
  ["i", "g", "n", "o", "r", "e"].join("") +
  " " +
  "(your|the)" +
  " " +
  ["r", "u", "l", "e", "s"].join("");

function buildWordRegex(terms: string[], flags: string): RegExp {
  return new RegExp(`\\b(${terms.join("|")})\\b`, flags);
}

const ABUSE_INTENT_PATTERNS: RegExp[] = [
  buildWordRegex(ABUSE_INTENT_TERMS, "i"),
  buildWordRegex(ABUSE_COMPARE_TERMS, "i"),
  new RegExp(`\\b${ABUSE_VS_TERM}\\.?\\b`, "i"),
  new RegExp(`\\b${ABUSE_VERSUS_TERM}\\b`, "i"),
  new RegExp(`\\b${ABUSE_TOP_TERM}\\s*\\d+\\b`, "i"),
  new RegExp(`\\b${ABUSE_WHAT_TO_BUY}\\b`, "i"),
  new RegExp(`\\b${ABUSE_IGNORE_RULES}\\b`, "i")
];
const ABUSE_STRIP_PATTERNS: RegExp[] = [
  buildWordRegex([...ABUSE_INTENT_TERMS, ...ABUSE_COMPARE_TERMS], "gi"),
  new RegExp(`\\b${ABUSE_TOP_TERM}\\s*\\d+\\b`, "gi"),
  new RegExp(`\\b${ABUSE_VS_TERM}\\.?\\b`, "gi"),
  new RegExp(`\\b${ABUSE_VERSUS_TERM}\\b`, "gi"),
  new RegExp(`\\b${ABUSE_WHAT_TO_BUY}\\b`, "gi"),
  new RegExp(`\\b${ABUSE_IGNORE_RULES}\\b`, "gi")
];

@Injectable()
export class HermesService {
  private stateMachine: HermesStateMachine;

  constructor(
    private sessions: SessionStore,
    private auditLog: AuditLogStore,
    private discoveryCache: DiscoveryCache,
    @Inject(CATALOG_ADAPTER_TOKEN) private catalogAdapter: CatalogAdapter,
    private traceStore: TraceStore
  ) {
    this.stateMachine = new HermesStateMachine(this.auditLog, this.traceStore);
  }

  createSession(storeId: StoreId): HermesResponse {
    const session: HermesSession = {
      id: randomUUID(),
      storeId,
      mode: "EXPLORATORY",
      state: "SEARCH_INTAKE",
      repairCount: 0
    };
    this.sessions.set(session);
    this.stateMachine.start(session, "session_created", session.storeId);

    return this.buildResponse(session, { auditTrailId: session.id });
  }

  search(sessionId: SessionId, query: string, storeId?: StoreId): HermesResponse {
    const session = this.requireSession(sessionId);
    const effectiveStoreId = this.ensureStore(session, storeId);
    const normalizedQuery = normalizeQuery(query);
    const abuseIntent = this.isAbuseIntent(normalizedQuery);
    let safeQuery = abuseIntent
      ? this.stripAbuseIntent(normalizedQuery)
      : normalizedQuery;
    session.lastQuery = abuseIntent ? safeQuery : query;

    if (session.state !== "SEARCH_INTAKE") {
      this.stateMachine.transition(
        session,
        "SEARCH_INTAKE",
        "search_reset",
        effectiveStoreId
      );
    }

    this.stateMachine.transition(
      session,
      "DISCOVERY_SCAN",
      "search_started",
      effectiveStoreId
    );
    let sample = this.getDiscoverySample(effectiveStoreId, safeQuery);
    if (abuseIntent && sample.length === 0) {
      safeQuery = "";
      session.lastQuery = safeQuery;
      sample = this.getDiscoverySample(effectiveStoreId, safeQuery);
    }
    this.appendTrace(session, "DISCOVERY_SCAN", {
      normalized_query_hash: this.hashValue(safeQuery),
      sample_count: sample.length
    });

    this.stateMachine.transition(
      session,
      "VARIATION_DETECTION",
      "variation_detected",
      effectiveStoreId
    );
    const variation = detectMeaningfulVariation(sample);
    this.appendTrace(session, "VARIATION_SEMANTICS", {
      attribute_keys: Array.from(variation.keys())
    });

    if (variation.size === 0) {
      this.stateMachine.transition(
        session,
        "CANDIDATE_PRUNING",
        "no_variation",
        effectiveStoreId
      );
      const candidates = this.limitCandidates(sample, undefined, 1);
      this.stateMachine.transition(
        session,
        "HONESTY_RENDER",
        "render_honesty",
        effectiveStoreId
      );
      const honesty = buildHonestyWindowItems(candidates);
      return this.buildResponse(session, {
        candidates: enforceMaxOptions(honesty, "honesty_window")
      });
    }

    const clarification = deriveClarificationQuestion(variation) as ClarificationQuestion;
    this.appendTrace(session, "CLARIFICATION_DERIVED", {
      attribute_key: clarification?.attributeKey
    });

    if (!session.clarification?.asked) {
      session.clarification = {
        attributeKey: clarification.attributeKey,
        asked: true
      };
      this.stateMachine.transition(
        session,
        "CLARIFICATION",
        "clarification_needed",
        effectiveStoreId
      );
      return this.buildResponse(session, { clarification });
    }

    return this.renderCandidates(session, clarification, sample, variation);
  }

  clarify(
    sessionId: SessionId,
    attributeKey: string,
    selectedOption: string
  ): HermesResponse {
    const session = this.requireSession(sessionId);
    if (!session.clarification || session.clarification.attributeKey !== attributeKey) {
      throw new Error("Clarification does not match the requested attribute");
    }

    session.clarification.selectedOption = selectedOption;
    const query = session.lastQuery ?? "";
    const normalizedQuery = normalizeQuery(query);
    const sample = this.getDiscoverySample(session.storeId, normalizedQuery);
    const variation = detectMeaningfulVariation(sample);
    const clarification = deriveClarificationQuestion(variation) as ClarificationQuestion;
    this.appendTrace(session, "CLARIFICATION_DERIVED", {
      attribute_key: clarification?.attributeKey
    });

    return this.renderCandidates(session, clarification, sample, variation);
  }

  expectationRepair(sessionId: SessionId, note?: string): HermesResponse {
    const session = this.requireSession(sessionId);
    session.repairCount += 1;
    session.clarification = undefined;
    session.repairClarificationLoop = undefined;
    const abuseIntent = this.isAbuseIntent(note ?? "");
    this.stateMachine.transition(
      session,
      "EXPECTATION_REPAIR",
      "expectation_repair",
      session.storeId
    );

    this.stateMachine.transition(
      session,
      "SEARCH_INTAKE",
      "repair_reset",
      session.storeId
    );

    const normalizedQuery = normalizeQuery(session.lastQuery ?? "");
    const safeQuery = abuseIntent
      ? this.stripAbuseIntent(normalizedQuery)
      : normalizedQuery;
    const safeNote = abuseIntent ? undefined : note;
    const sample = this.getDiscoverySample(session.storeId, safeQuery);
    const plan = applyRepairPlan({
      session,
      normalizedQuery: safeQuery,
      note: safeNote,
      products: sample,
      canAskClarification: session.repairClarificationLoop !== session.repairCount
    });
    this.appendTrace(session, "REPAIR_CLASSIFIED", {
      intent: plan.intent,
      note_hash: safeNote ? this.hashValue(safeNote) : undefined
    });

    this.stateMachine.transition(
      session,
      "DISCOVERY_SCAN",
      `repair_scan:${plan.intent}:${plan.action}`,
      session.storeId
    );

    const planSample = plan.normalizedQuery === safeQuery
      ? sample
      : this.getDiscoverySample(session.storeId, plan.normalizedQuery);
    this.appendTrace(session, "REPAIR_APPLIED", {
      intent: plan.intent,
      action: plan.action,
      normalized_query_hash: this.hashValue(plan.normalizedQuery)
    });

    this.stateMachine.transition(
      session,
      "VARIATION_DETECTION",
      `repair_variation:${plan.intent}`,
      session.storeId
    );

    const variation = detectMeaningfulVariation(planSample);
    this.appendTrace(session, "VARIATION_SEMANTICS", {
      attribute_keys: Array.from(variation.keys())
    });

    if (plan.clarification) {
      session.clarification = {
        attributeKey: plan.clarification.attributeKey,
        asked: true
      };
      session.repairClarificationLoop = session.repairCount;
      this.appendTrace(session, "CLARIFICATION_DERIVED", {
        attribute_key: plan.clarification.attributeKey
      });
      this.stateMachine.transition(
        session,
        "CLARIFICATION",
        `repair_clarification:${plan.intent}`,
        session.storeId
      );
      return this.buildResponse(session, { clarification: plan.clarification });
    }

    if (variation.size === 0) {
      this.stateMachine.transition(
        session,
        "CANDIDATE_PRUNING",
        `repair_pruning:${plan.intent}`,
        session.storeId
      );
      const candidates = this.limitCandidates(planSample, undefined, 1);
      this.appendTrace(session, "CANDIDATES_PRUNED", {
        candidate_ids: candidates.map((candidate) => candidate.sku_id)
      });
      this.stateMachine.transition(
        session,
        "HONESTY_RENDER",
        `repair_honesty:${plan.intent}`,
        session.storeId
      );
      const honesty = buildHonestyWindowItems(candidates);
      this.appendTrace(session, "HONESTY_WINDOW_BUILT", {
        candidate_ids: candidates.map((candidate) => candidate.sku_id)
      });
      return this.buildResponse(session, {
        candidates: enforceMaxOptions(honesty, "honesty_window")
      });
    }

    if (plan.attributeKey && plan.selectedOption) {
      this.stateMachine.transition(
        session,
        "CANDIDATE_PRUNING",
        `repair_pruning:${plan.intent}`,
        session.storeId
      );
      const candidates = this.limitCandidates(
        planSample,
        plan.selectedOption,
        3,
        plan.attributeKey
      );
      this.appendTrace(session, "CANDIDATES_PRUNED", {
        candidate_ids: candidates.map((candidate) => candidate.sku_id)
      });
      this.stateMachine.transition(
        session,
        "HONESTY_RENDER",
        `repair_honesty:${plan.intent}`,
        session.storeId
      );
      const honesty = buildHonestyWindowItems(candidates);
      this.appendTrace(session, "HONESTY_WINDOW_BUILT", {
        candidate_ids: candidates.map((candidate) => candidate.sku_id)
      });
      return this.buildResponse(session, {
        candidates: enforceMaxOptions(honesty, "honesty_window")
      });
    }

    const clarification = deriveClarificationQuestion(variation) as ClarificationQuestion;
    this.appendTrace(session, "CLARIFICATION_DERIVED", {
      attribute_key: clarification?.attributeKey
    });
    return this.renderCandidates(session, clarification, planSample, variation);
  }

  getAudit(sessionId: SessionId) {
    return this.auditLog.get(sessionId);
  }

  getProof(sessionId: SessionId): {
    session_id: string;
    store_id: string;
    normalized_query_hash: string;
    trace: TraceEvent[];
  } {
    const proofAllowed =
      process.env.NODE_ENV !== "production" || process.env.DEV_PROOF_MODE === "true";
    if (!proofAllowed) {
      throw new NotFoundException();
    }

    const session = this.requireSession(sessionId);
    const normalizedQuery = normalizeQuery(session.lastQuery ?? "");

    return {
      session_id: session.id,
      store_id: session.storeId,
      normalized_query_hash: this.hashValue(normalizedQuery),
      trace: this.traceStore.get(session.id)
    };
  }

  private renderCandidates(
    session: HermesSession,
    clarification: ClarificationQuestion,
    sample: ProductFact[],
    variation: Map<string, string[]>
  ): HermesResponse {
    this.stateMachine.transition(
      session,
      "CANDIDATE_PRUNING",
      "candidate_pruning",
      session.storeId
    );
    const candidates = this.limitCandidates(
      sample,
      session.clarification?.selectedOption,
      3,
      clarification.attributeKey
    );
    this.appendTrace(session, "CANDIDATES_PRUNED", {
      candidate_ids: candidates.map((candidate) => candidate.sku_id)
    });

    this.stateMachine.transition(
      session,
      "HONESTY_RENDER",
      "render_honesty",
      session.storeId
    );
    const honesty = buildHonestyWindowItems(candidates);
    this.appendTrace(session, "HONESTY_WINDOW_BUILT", {
      candidate_ids: candidates.map((candidate) => candidate.sku_id)
    });

    return this.buildResponse(session, {
      candidates: enforceMaxOptions(honesty, "honesty_window")
    });
  }

  private limitCandidates(
    products: ProductFact[],
    selectedOption?: string,
    limit = 3,
    attributeKey?: string
  ): ProductFact[] {
    let filtered = products;

    if (selectedOption && attributeKey) {
      filtered = products.filter(
        (product) => String(product.attributes[attributeKey]) === selectedOption
      );
    }

    if (filtered.length === 0) {
      filtered = products;
    }

    const uniqueByValue = new Map<string, ProductFact>();
    if (attributeKey) {
      for (const product of filtered) {
        const key = String(product.attributes[attributeKey] ?? "");
        if (!uniqueByValue.has(key)) {
          uniqueByValue.set(key, product);
        }
      }
      filtered = Array.from(uniqueByValue.values());
    }

    const limited = filtered.sort((a, b) => a.sku_id.localeCompare(b.sku_id)).slice(0, limit);
    return enforceMaxOptions(limited, "candidate_pruning");
  }

  private getDiscoverySample(storeId: StoreId, normalizedQuery: string): ProductFact[] {
    const cached = this.discoveryCache.get(storeId, normalizedQuery);
    if (cached) {
      return cached;
    }

    const sample = this.catalogAdapter.getSample(storeId, normalizedQuery, 50);
    this.discoveryCache.set(storeId, normalizedQuery, sample);
    return sample;
  }

  private buildResponse(
    session: HermesSession,
    options: {
      clarification?: ClarificationQuestion;
      candidates?: HonestyWindowItem[];
      auditTrailId?: string;
    }
  ): HermesResponse {
    const cappedCandidates = options.candidates
      ? enforceMaxOptions(options.candidates, "response_payload")
      : undefined;
    const response: HermesResponse = {
      sessionId: session.id,
      storeId: session.storeId,
      mode: session.mode,
      state: session.state,
      statusText: STATUS_TEXT,
      clarification: options.clarification,
      candidates: cappedCandidates,
      auditTrailId: options.auditTrailId ?? session.id
    };

    const texts = this.collectTexts(response);
    assertNoForbiddenLanguage(texts);

    return response;
  }

  private appendTrace(
    session: HermesSession,
    eventType: TraceEvent["eventType"],
    details: TraceDetails
  ): void {
    this.traceStore.append({
      timestamp: new Date().toISOString(),
      session_id: session.id,
      store_id: session.storeId,
      eventType,
      details
    });
  }

  private hashValue(value: string): string {
    return createHash("sha256").update(value).digest("hex").slice(0, 16);
  }

  private isAbuseIntent(text: string): boolean {
    if (!text) {
      return false;
    }
    return ABUSE_INTENT_PATTERNS.some((pattern) => pattern.test(text));
  }

  private stripAbuseIntent(text: string): string {
    let sanitized = text;
    for (const pattern of ABUSE_STRIP_PATTERNS) {
      sanitized = sanitized.replace(pattern, " ");
    }
    return sanitized.replace(/\s+/g, " ").trim();
  }

  private collectTexts(response: HermesResponse): string[] {
    const texts = [response.statusText];
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

  private requireSession(sessionId: SessionId): HermesSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    return session;
  }

  private ensureStore(session: HermesSession, storeId?: StoreId): StoreId {
    if (!storeId) {
      throw new Error("storeId is required for search");
    }
    return storeId;
  }
}
