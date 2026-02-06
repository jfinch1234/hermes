import type { HermesResponse } from "@hermes/domain";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function createSession(storeId: string): Promise<HermesResponse> {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeId })
  });

  if (!response.ok) {
    throw new Error("Failed to create session");
  }

  return response.json();
}

export async function runSearch(
  sessionId: string,
  query: string,
  storeId: string
): Promise<HermesResponse> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, storeId })
  });

  if (!response.ok) {
    throw new Error("Search request failed");
  }

  return response.json();
}

export async function runClarify(
  sessionId: string,
  attributeKey: string,
  selectedOption: string
): Promise<HermesResponse> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/clarify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attributeKey, selectedOption })
  });

  if (!response.ok) {
    throw new Error("Clarification failed");
  }

  return response.json();
}

export async function runRepair(sessionId: string): Promise<HermesResponse> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/repair`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("Expectation repair failed");
  }

  return response.json();
}
