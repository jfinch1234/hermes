# API Reference (Hermes UI)

Base URL: configured by the client (see `NEXT_PUBLIC_API_BASE_URL`).

## Create session
- Route: `POST /sessions`
- Body: `{ storeId }`
- Response (high level): `{ sessionId, storeId, state, statusText, auditTrailId }`

## Search
- Route: `POST /sessions/:sessionId/search`
- Body: `{ query, storeId }`
- Response (high level):
  - `statusText`, `state`
  - `clarification` (optional): `{ attributeKey, question, options[] }`
  - `candidates` (optional): array of honesty window items
  - `auditTrailId`, `sessionId`, `storeId`

## Clarification submit
- Route: `POST /sessions/:sessionId/clarify`
- Body: `{ attributeKey, selectedOption }`
- Response (high level): same as Search response

## Repair
- Route: `POST /sessions/:sessionId/repair`
- Body: none
- Response (high level): same as Search response

## Proof (guarded)
- Route: `GET /api/hermes/session/:sessionId/proof`
- Availability: dev/staging only (not in production)
- Response (high level):
  - `session_id`, `store_id`, `normalized_query_hash`
  - `trace`: array of decision events
  - `honesty_window` (optional)
