# Release Checklist

## Runbook: Docker Compose

1. Build and start services:
   - docker compose up --build
2. Verify API and web are healthy:
   - http://localhost:3001/health
   - http://localhost:3001/ready
   - http://localhost:3000
3. Stop services:
   - docker compose down

## Invariants and Guardrails

- Run typecheck, tests, and invariants:
  - pnpm run typecheck
  - pnpm test
  - pnpm run test:invariants
  - pnpm run lint:copy
- Confirm no forbidden persuasion language appears in outputs.

## Proof Mode Safety

- With NODE_ENV=production and DEV_PROOF_MODE=false, proof endpoint returns 404.
- With DEV_PROOF_MODE=true in non-production, proof endpoint returns trace only.

## Smoke Tests

- Meaningful variation -> one clarification:
  - Search "bottle" in store-outdoor, expect clarification prompt.
- Cosmetic-only -> collapse to one option:
  - Search "notebook" in store-stationery, expect single result with cosmetics note.
- Mismatch -> repair loop:
  - Search "headphones" in store-audio then run repair, expect clarification or honesty.

## Performance Notes

- Discovery scan should complete in under 1s in dev.
