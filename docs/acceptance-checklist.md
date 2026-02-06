# Hermes Acceptance Checklist

## Core identity
- [ ] Single-store context enforced per session
- [ ] Output capped at 3 products
- [ ] No ranking, recommendation, or persuasion language
- [ ] Exploration-first flow starts in EXPLORATORY mode

## Engine state machine
- [ ] Deterministic transitions across required states only
- [ ] Full audit trail of state transitions
- [ ] Expectation repair loop-safe and non-punitive

## Discovery and variation
- [ ] Sampling limited to 20-50 products
- [ ] Meaningful variation detected; cosmetic differences ignored
- [ ] Clarification derived only from real variance
- [ ] One clarification question maximum
- [ ] No-variation case collapses to one option with explicit honesty

## Honesty window
- [ ] Product name, price, what is different, why it matters, who it is better for
- [ ] Comparative language only; no superiority
- [ ] Subtle differences explicitly acknowledged

## Language firewall
- [ ] Forbidden terms blocked server-side
- [ ] Forbidden terms blocked client-side
- [ ] Tests fail on violations

## Architecture
- [ ] NestJS backend, deterministic services
- [ ] Next.js App Router frontend, search-first UI
- [ ] Status text matches required phrasing
- [ ] Clarification via attribute chips only
- [ ] Expectation repair control visible
- [ ] Catalog adapter single-store only
- [ ] Discovery scans cached by store + normalized query
- [ ] Product attributes stored as structured JSON
- [ ] No ranking fields in schema

## Seed data
- [ ] Meaningful variation case
- [ ] Cosmetic-only case
- [ ] Expectation repair case

## Tests
- [ ] Engine constraints validated
- [ ] Language firewall validated
- [ ] Variation logic validated
