"use client";

import { useEffect, useMemo, useState } from "react";
import type { HermesResponse } from "@hermes/domain";
import { validateClientLanguage } from "../lib/guardrails";
import { createSession, runClarify, runRepair, runSearch } from "../lib/api";

const STATUS_TEXT = "We’re narrowing options so you get the right product.";

export default function Page() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<HermesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const storeId = "store-outdoor";

  useEffect(() => {
    createSession(storeId)
      .then((session) => setSessionId(session.sessionId))
      .catch((err) => setError(err.message));
  }, []);

  const statusText = useMemo(() => {
    return response?.statusText ?? STATUS_TEXT;
  }, [response]);

  const handleSearch = async () => {
    if (!sessionId || !query.trim()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await runSearch(sessionId, query, storeId);
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
      const result = await runSearch(sessionId, query, storeId);
      validateClientLanguage(result);
      setResponse(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <section className="header">
        <h1>Hermes</h1>
        <p className="subtitle">
          An exploratory honesty engine that narrows options without ranking or
          persuasion.
        </p>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="status">{statusText}</div>
          <div className="search-row" style={{ marginTop: 16 }}>
            <input
              type="text"
              value={query}
              placeholder="Start with a product type or use case"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Scanning" : "Explore"}
            </button>
            <button type="button" className="repair" onClick={handleRepair}>
              Not what I expected
            </button>
          </div>

          {response?.clarification ? (
            <div style={{ marginTop: 24 }}>
              <div className="label">Clarify one attribute</div>
              <p>{response.clarification.question}</p>
              <div className="chips">
                {response.clarification.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="chip"
                    onClick={() =>
                      handleClarify(response.clarification!.attributeKey, option)
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <div className="error" style={{ marginTop: 20 }}>{error}</div> : null}
        </div>

        <div className="panel">
          <div className="label">Honesty window</div>
          {response?.candidates?.length ? (
            response.candidates.map((candidate) => (
              <div key={candidate.productId} className="card">
                <div className="value" style={{ fontWeight: 700 }}>{candidate.name}</div>
                <div className="value">{candidate.currency} {candidate.price}</div>
                <div className="label">What is different</div>
                <div className="value">{candidate.whatsDifferent}</div>
                <div className="label">Why it matters</div>
                <div className="value">{candidate.whyItMatters}</div>
                <div className="label">Who it is better for</div>
                <div className="value">{candidate.whoItsBetterFor}</div>
                {candidate.differencesNote ? (
                  <div className="value">{candidate.differencesNote}</div>
                ) : null}
                {candidate.variationNote ? (
                  <div className="value">{candidate.variationNote}</div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="subtitle">No products narrowed yet. Start with a search.</p>
          )}
        </div>
      </section>
    </main>
  );
}
