import type { TraceEvent, SessionId, TraceDetails } from "@hermes/domain";
import { DISALLOWED_TRACE_KEYS } from "@hermes/domain";
import { forbiddenLanguage } from "@hermes/rules";

export class TraceStore {
  private events = new Map<SessionId, TraceEvent[]>();
  private maxEvents = 200;
  private disallowedDetailKeys = new RegExp(
    DISALLOWED_TRACE_KEYS.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "i"
  );

  append(event: TraceEvent): void {
    const list = this.events.get(event.session_id) ?? [];
    list.push({
      ...event,
      details: this.sanitizeDetails(event.details)
    });
    if (list.length > this.maxEvents) {
      list.splice(0, list.length - this.maxEvents);
    }
    this.events.set(event.session_id, list);
  }

  get(sessionId: SessionId): TraceEvent[] {
    return (this.events.get(sessionId) ?? []).map((event) => ({
      ...event,
      details: this.cloneDetails(event.details)
    }));
  }

  private sanitizeDetails(details: TraceDetails): TraceDetails {
    const sanitized = this.sanitizeValue(details);
    return (sanitized && typeof sanitized === "object" && !Array.isArray(sanitized))
      ? (sanitized as TraceDetails)
      : {};
  }

  private sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "string") {
      return this.containsForbiddenTerm(value) ? undefined : value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      const sanitized = value
        .map((item) => this.sanitizeValue(item))
        .filter((item) => item !== undefined);
      return sanitized;
    }

    if (typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
        if (this.disallowedDetailKeys.test(key)) {
          continue;
        }
        const sanitized = this.sanitizeValue(entry);
        if (sanitized !== undefined) {
          result[key] = sanitized;
        }
      }
      return result;
    }

    return undefined;
  }

  private containsForbiddenTerm(value: string): boolean {
    const normalized = value.toLowerCase();
    return forbiddenLanguage.some((term) => normalized.includes(term));
  }

  private cloneDetails(details: TraceDetails): TraceDetails {
    return JSON.parse(JSON.stringify(details)) as TraceDetails;
  }
}
