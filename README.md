# Hermes

Hermes is an exploratory honesty engine for decision clarity. It does not rank, recommend, or persuade. It narrows choices by surfacing meaningful variation within a single store context and explains differences in plain, neutral language.

## Monorepo layout

- `apps/api`: NestJS backend with deterministic Hermes engine
- `apps/web`: Next.js App Router frontend
- `packages/domain`: shared domain types
- `packages/rules`: language firewall, variation detection, honesty window helpers, invariants
- `packages/seed`: seed data for required scenarios
- `docs/acceptance-checklist.md`: requirement checklist
- `tools/`: copy firewall + launch simulation scripts

## Development

Install dependencies with pnpm, then run both apps:

```bash
pnpm install
pnpm dev
```

Web: http://localhost:3000

API: http://localhost:3001
