import type { HermesSession, SessionId } from "@hermes/domain";

export class SessionStore {
  private sessions = new Map<SessionId, HermesSession>();

  get(sessionId: SessionId): HermesSession | undefined {
    return this.sessions.get(sessionId);
  }

  set(session: HermesSession): void {
    this.sessions.set(session.id, session);
  }
}
