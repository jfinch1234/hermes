"use client";

import React, { useMemo, useState } from "react";
import type { HermesResponse, HonestyWindowItem } from "@hermes/domain";
import { validateClientLanguage } from "../../lib/guardrails";
import { createSession, runClarify, runRepair, runSearch } from "../../lib/api";

const STORE_ID = "store-outdoor";
const MAX_OPTIONS = 3;

function formatPrice(item: HonestyWindowItem) {
  return `${item.currency} ${item.price}`;
}

export default function EmbedExamplePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<HermesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const statusLine = useMemo(() => {
    if (isLoading) {
      return "Status: working";
    }
    if (response) {
      return `Status: ${response.state}`;
    }
    return "Status: idle";
  }, [isLoading, response]);

  const candidates = response?.candidates ?? [];
  const visibleCandidates = candidates.slice(0, MAX_OPTIONS);

  const ensureSession = async () => {
    if (sessionId) {
      return sessionId;
    }
    const session = await createSession(STORE_ID);
    setSessionId(session.sessionId);
    return session.sessionId;
  };

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const activeSession = await ensureSession();
      const result = await runSearch(activeSession, trimmedQuery, STORE_ID);
      validateClientLanguage(result);
      setResponse(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarify = async (attributeKey: string, option: string) => {
    if (!sessionId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await runClarify(sessionId, attributeKey, option);
      validateClientLanguage(result);
      setResponse(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepair = async () => {
    if (!sessionId || !query.trim()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await runRepair(sessionId);
      const result = await runSearch(sessionId, query.trim(), STORE_ID);
      validateClientLanguage(result);
      setResponse(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="embed-root">
      <section className="embed-panel">
        <h1 className="embed-title">Embed Example</h1>
        <div className="embed-status" data-testid="status-line">
          {statusLine}
        </div>
        <div className="embed-input-row">
          <input
            type="text"
            value={query}
            placeholder="Enter a product query"
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="embed-button"
            onClick={handleSearch}
            disabled={isLoading}
            data-testid="search-button"
          >
            Search
          </button>
          <button
            type="button"
            className="embed-button embed-secondary"
            onClick={handleRepair}
            data-testid="repair-button"
          >
            Not what I expected
          </button>
        </div>
        {error ? <div className="embed-error">{error}</div> : null}
      </section>

      {response?.clarification ? (
        <section className="embed-panel">
          <div className="embed-label">Clarification</div>
          <div className="embed-question">{response.clarification.question}</div>
          <div className="embed-chips">
            {response.clarification.options.map((option) => (
              <button
                key={option}
                type="button"
                className="embed-chip"
                onClick={() =>
                  handleClarify(response.clarification!.attributeKey, option)
                }
                data-testid="clarify-chip"
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="embed-panel">
        <div className="embed-label">Options</div>
        {visibleCandidates.length ? (
          <div className="embed-grid">
            {visibleCandidates.map((candidate) => (
              <div
                key={candidate.productId}
                className="embed-option"
                data-testid="embed-option"
              >
                <div className="embed-option-title">{candidate.name}</div>
                <div className="embed-option-meta">
                  {formatPrice(candidate)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="embed-muted">No options yet.</div>
        )}
      </section>

      <section className="embed-panel" data-testid="honesty-window">
        <div className="embed-label">Honesty window</div>
        {visibleCandidates.length ? (
          <div className="embed-stack">
            {visibleCandidates.map((candidate) => (
              <div
                key={candidate.productId}
                className="embed-honesty"
              >
                <div className="embed-option-title">{candidate.name}</div>
                <div className="embed-option-meta">
                  {formatPrice(candidate)}
                </div>
                <div className="embed-honesty-section">
                  <div className="embed-honesty-label">whatsDifferent</div>
                  <div>{candidate.whatsDifferent}</div>
                </div>
                <div className="embed-honesty-section">
                  <div className="embed-honesty-label">whyItMatters</div>
                  <div>{candidate.whyItMatters}</div>
                </div>
                <div className="embed-honesty-section">
                  <div className="embed-honesty-label">whoItsBetterFor</div>
                  <div>{candidate.whoItsBetterFor}</div>
                </div>
                {candidate.differencesNote ? (
                  <div className="embed-muted">
                    {candidate.differencesNote}
                  </div>
                ) : null}
                {candidate.variationNote ? (
                  <div className="embed-muted">
                    {candidate.variationNote}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="embed-muted">No honesty window entries yet.</div>
        )}
      </section>

      <style jsx>{`
        .embed-root {
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 20px 64px;
          display: grid;
          gap: 20px;
          color: #1f1f1f;
        }

        .embed-panel {
          border: 1px solid #d8d8d8;
          border-radius: 12px;
          padding: 20px;
          background: #f8f8f8;
        }

        .embed-title {
          margin: 0 0 12px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .embed-status {
          font-size: 0.95rem;
          color: #3d3d3d;
          padding: 8px 12px;
          background: #efefef;
          border-radius: 8px;
        }

        .embed-input-row {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .embed-input-row input {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #c9c9c9;
          font-size: 1rem;
          background: #ffffff;
        }

        .embed-button {
          border: 1px solid #b8b8b8;
          border-radius: 8px;
          padding: 10px 14px;
          background: #e4e4e4;
          color: #1f1f1f;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: none;
          box-shadow: none;
        }

        .embed-button:hover {
          transform: none;
          box-shadow: none;
          background: #dedede;
        }

        .embed-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .embed-secondary {
          background: #f1f1f1;
        }

        .embed-label {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.75rem;
          color: #4a4a4a;
          margin-bottom: 8px;
        }

        .embed-question {
          margin-bottom: 12px;
        }

        .embed-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .embed-chip {
          border: 1px solid #c9c9c9;
          border-radius: 999px;
          padding: 6px 12px;
          background: #f0f0f0;
          color: #1f1f1f;
          font-size: 0.9rem;
          cursor: pointer;
          transition: none;
        }

        .embed-chip:hover {
          transform: none;
          box-shadow: none;
          background: #e6e6e6;
        }

        .embed-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .embed-option {
          border: 1px solid #d0d0d0;
          border-radius: 10px;
          padding: 12px;
          background: #ffffff;
        }

        .embed-option-title {
          font-weight: 600;
          margin-bottom: 6px;
        }

        .embed-option-meta {
          color: #4a4a4a;
          font-size: 0.9rem;
        }

        .embed-stack {
          display: grid;
          gap: 16px;
        }

        .embed-honesty {
          border: 1px solid #d0d0d0;
          border-radius: 10px;
          padding: 12px;
          background: #ffffff;
        }

        .embed-honesty-section {
          margin-top: 10px;
        }

        .embed-honesty-label {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 0.8rem;
          color: #4a4a4a;
          margin-bottom: 4px;
        }

        .embed-muted {
          color: #5c5c5c;
          font-size: 0.9rem;
        }

        .embed-error {
          margin-top: 12px;
          color: #7a1d1d;
          background: #f2dede;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e0b4b4;
        }

        @media (min-width: 720px) {
          .embed-input-row {
            grid-template-columns: 1fr auto auto;
            align-items: center;
          }
        }
      `}</style>
    </main>
  );
}
