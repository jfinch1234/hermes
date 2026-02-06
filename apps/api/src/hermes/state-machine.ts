import type { HermesSession, HermesState, StoreId } from "@hermes/domain";
import { assertValidTransition } from "@hermes/domain";
import type { AuditLogStore } from "./audit-log";
import { TraceStore } from "./trace-store";

export class HermesStateMachine {
  constructor(private auditLog: AuditLogStore, private traceStore: TraceStore) {}

  transition(
    session: HermesSession,
    next: HermesState,
    reason: string,
    storeId: StoreId
  ): void {
    const current = session.state;
    this.assertStoreConsistency(session, storeId, `transition:${reason}`);
    assertValidTransition(current, next);

    session.state = next;
    this.auditLog.record(session.id, {
      from: current,
      to: next,
      reason,
      at: new Date().toISOString()
    });
    this.traceStore.append({
      timestamp: new Date().toISOString(),
      session_id: session.id,
      store_id: session.storeId,
      eventType: "STATE_TRANSITION",
      state_from: current,
      state_to: next,
      details: { reason }
    });
  }

  start(session: HermesSession, reason: string, storeId: StoreId): void {
    this.assertStoreConsistency(session, storeId, `start:${reason}`);
    this.auditLog.record(session.id, {
      to: session.state,
      reason,
      at: new Date().toISOString()
    });
    this.traceStore.append({
      timestamp: new Date().toISOString(),
      session_id: session.id,
      store_id: session.storeId,
      eventType: "STATE_TRANSITION",
      state_to: session.state,
      details: { reason }
    });
  }

  private assertStoreConsistency(
    session: HermesSession,
    storeId: StoreId,
    reason: string
  ): void {
    if (session.storeId !== storeId) {
      this.auditLog.record(session.id, {
        from: session.state,
        to: session.state,
        reason: `store_mismatch:${reason}`,
        at: new Date().toISOString()
      });
      throw new Error("Session is locked to a single store");
    }
  }
}
