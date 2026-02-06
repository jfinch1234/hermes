import type { HermesState, SessionId } from "@hermes/domain";

export interface AuditEvent {
  from?: HermesState;
  to: HermesState;
  at: string;
  reason: string;
}

export class AuditLogStore {
  private logs = new Map<SessionId, AuditEvent[]>();

  record(sessionId: SessionId, event: AuditEvent): void {
    const existing = this.logs.get(sessionId) ?? [];
    existing.push(event);
    this.logs.set(sessionId, existing);
  }

  get(sessionId: SessionId): AuditEvent[] {
    return this.logs.get(sessionId) ?? [];
  }
}
