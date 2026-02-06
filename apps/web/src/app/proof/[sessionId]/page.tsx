import React from "react";
import { notFound } from "next/navigation";
import type { HonestyWindowItem } from "@hermes/domain";
import { generatePolicyReport } from "@hermes/domain";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type ProofTraceEvent = {
  timestamp: string;
  eventType: string;
  details: Record<string, unknown>;
  state_from?: string;
  state_to?: string;
  store_id: string;
};

type ProofPayload = {
  session_id: string;
  store_id: string;
  normalized_query_hash: string;
  trace: ProofTraceEvent[];
  honesty_window?: HonestyWindowItem[];
};

async function fetchProof(sessionId: string): Promise<ProofPayload | null> {
  const response = await fetch(
    `${API_BASE}/api/hermes/session/${sessionId}/proof`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function formatDetail(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function findExpectationRepair(trace: ProofTraceEvent[]) {
  const classified = trace.find((event) => event.eventType === "REPAIR_CLASSIFIED");
  const applied = trace.find((event) => event.eventType === "REPAIR_APPLIED");
  if (!classified && !applied) {
    return null;
  }
  return {
    intent: classified?.details?.intent ?? null,
    action: applied?.details?.action ?? null
  };
}

export default async function ProofPage({
  params
}: {
  params: { sessionId: string };
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const proof = await fetchProof(params.sessionId);
  if (!proof) {
    notFound();
  }

  const policyReport = generatePolicyReport();
  const expectationRepair = findExpectationRepair(proof.trace);

  return (
    <main>
      <section className="header">
        <h1>Proof</h1>
        <p className="subtitle">
          Inspection-only view of Hermes decision artifacts.
        </p>
      </section>

      <section className="panel">
        <div className="label">Session Summary</div>
        <div className="value">Session ID: {proof.session_id}</div>
        <div className="value">Store ID: {proof.store_id}</div>
        <div className="value">Query hash: {proof.normalized_query_hash}</div>
      </section>

      <section className="panel">
        <div className="label">Decision Timeline</div>
        <div style={{ display: "grid", gap: 16 }}>
          {proof.trace.map((event, index) => (
            <div key={`${event.eventType}-${index}`}>
              <div
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
                  fontSize: "0.85rem",
                  color: "var(--muted)"
                }}
              >
                {event.timestamp} · {event.eventType}
              </div>
              <pre
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #efe2d8",
                  fontSize: "0.85rem",
                  whiteSpace: "pre-wrap",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
                }}
              >
                {formatDetail({
                  store_id: event.store_id,
                  state_from: event.state_from,
                  state_to: event.state_to,
                  details: event.details
                })}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="label">Honesty Window</div>
        {proof.honesty_window?.length ? (
          proof.honesty_window.map((item) => (
            <div key={item.productId} className="card">
              <div className="value" style={{ fontWeight: 700 }}>{item.name}</div>
              <div className="value">{item.currency} {item.price}</div>
              <div className="label">What is different</div>
              <div className="value">{item.whatsDifferent}</div>
              <div className="label">Why it matters</div>
              <div className="value">{item.whyItMatters}</div>
              <div className="label">Who it is better for</div>
              <div className="value">{item.whoItsBetterFor}</div>
              {item.differencesNote ? (
                <div className="value">{item.differencesNote}</div>
              ) : null}
              {item.variationNote ? (
                <div className="value">{item.variationNote}</div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="subtitle">No honesty window recorded for this session.</p>
        )}
      </section>

      {expectationRepair ? (
        <section className="panel">
          <div className="label">Expectation Repair</div>
          <div className="value">Intent: {String(expectationRepair.intent)}</div>
          <div className="value">Strategy: {String(expectationRepair.action)}</div>
        </section>
      ) : null}

      <section className="panel">
        <div className="label">Policy Guarantees</div>
        <div style={{ display: "grid", gap: 12 }}>
          {Object.entries(policyReport.policy).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #efe2d8"
              }}
            >
              <div
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
                  fontSize: "0.85rem"
                }}
              >
                {key}: {String(value)}
              </div>
              <span
                style={{
                  fontSize: "0.8rem",
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid #d6c6b8",
                  background: "#f7f1e8"
                }}
              >
                Enforced
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
