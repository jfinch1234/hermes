"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { HermesResponse, HonestyWindowItem } from "@hermes/domain";
import { validateClientLanguage } from "../../lib/guardrails";
import { createSession, runClarify, runRepair, runSearch } from "../../lib/api";
import { parseThemeFromSearchParams } from "../../lib/theme";

const STORE_ID = "store-outdoor";
const MAX_OPTIONS = 3;

function formatPrice(item: HonestyWindowItem) {
  return `${item.currency} ${item.price}`;
}

export default function EmbedExamplePage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<HermesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { theme } = useMemo(
    () => parseThemeFromSearchParams(searchParams),
    [searchParams]
  );
  const resolvedFontFamily =
    theme.fontFamily === "system"
      ? "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
      : theme.fontFamily;
  const themeStyle = useMemo(
    () =>
      ({
        "--hermes-font-family": resolvedFontFamily,
        "--hermes-bg": theme.bg,
        "--hermes-surface": theme.surface,
        "--hermes-border": theme.border,
        "--hermes-text": theme.text,
        "--hermes-muted-text": theme.mutedText,
        "--hermes-radius": `${theme.radiusPx}px`,
        "--hermes-base-font-size": `${theme.baseFontSizePx}px`
      }) as React.CSSProperties,
    [resolvedFontFamily, theme]
  );

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
    <div className="hermes-theme-root" style={themeStyle}>
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
          color: var(--hermes-text);
          font-family: var(--hermes-font-family);
          font-size: var(--hermes-base-font-size);
        }

        .embed-panel {
          border: 1px solid var(--hermes-border);
          border-radius: var(--hermes-radius);
          padding: 20px;
          background: var(--hermes-surface);
        }

        .embed-title {
          margin: 0 0 12px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .embed-status {
          font-size: 0.95rem;
          color: var(--hermes-muted-text);
          padding: 8px 12px;
          background: var(--hermes-bg);
          border-radius: calc(var(--hermes-radius) - 2px);
          border: 1px solid var(--hermes-border);
        }

        .embed-input-row {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .embed-input-row input {
          padding: 10px 12px;
          border-radius: calc(var(--hermes-radius) - 2px);
          border: 1px solid var(--hermes-border);
          font-size: 1rem;
          background: var(--hermes-bg);
          color: var(--hermes-text);
        }

        .embed-button {
          border: 1px solid var(--hermes-border);
          border-radius: calc(var(--hermes-radius) - 2px);
          padding: 10px 14px;
          background: var(--hermes-surface);
          color: var(--hermes-text);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: none;
          box-shadow: none;
        }

        .embed-button:hover {
          transform: none;
          box-shadow: none;
        }

        .embed-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .embed-secondary {
          background: var(--hermes-bg);
        }

        .embed-label {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.75rem;
          color: var(--hermes-muted-text);
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
          border: 1px solid var(--hermes-border);
          border-radius: 999px;
          padding: 6px 12px;
          background: var(--hermes-bg);
          color: var(--hermes-text);
          font-size: 0.9rem;
          cursor: pointer;
          transition: none;
        }

        .embed-chip:hover {
          transform: none;
          box-shadow: none;
        }

        .embed-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .embed-option {
          border: 1px solid var(--hermes-border);
          border-radius: calc(var(--hermes-radius) - 2px);
          padding: 12px;
          background: var(--hermes-bg);
        }

        .embed-option-title {
          font-weight: 600;
          margin-bottom: 6px;
        }

        .embed-option-meta {
          color: var(--hermes-muted-text);
          font-size: 0.9rem;
        }

        .embed-stack {
          display: grid;
          gap: 16px;
        }

        .embed-honesty {
          border: 1px solid var(--hermes-border);
          border-radius: calc(var(--hermes-radius) - 2px);
          padding: 12px;
          background: var(--hermes-bg);
        }

        .embed-honesty-section {
          margin-top: 10px;
        }

        .embed-honesty-label {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 0.8rem;
          color: var(--hermes-muted-text);
          margin-bottom: 4px;
        }

        .embed-muted {
          color: var(--hermes-muted-text);
          font-size: 0.9rem;
        }

        .embed-error {
          margin-top: 12px;
          color: var(--hermes-text);
          background: var(--hermes-bg);
          padding: 8px 12px;
          border-radius: calc(var(--hermes-radius) - 2px);
          border: 1px solid var(--hermes-border);
        }

        @media (min-width: 720px) {
          .embed-input-row {
            grid-template-columns: 1fr auto auto;
            align-items: center;
          }
        }
      `}</style>
      </main>
    </div>
  );
}
