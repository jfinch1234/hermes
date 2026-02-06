# Enterprise Policy Appendix

Hermes enterprise policies are immutable and non-configurable.

## Immutable guarantees

- `forbidRanking`: true\n  - Enforced in: startup_policy_validation: apps/api/src/main.ts, response_option_cap: apps/api/src/hermes/hermes.service.ts, response_field_guard: apps/api/src/hermes/hermes.service.ts\n  - Verified by: packages/rules/src/hermes.invariants.test.ts, apps/api/src/hermes/hermes.policy.test.ts, apps/api/src/hermes/hermes.service.test.ts
- `forbidRecommendations`: true\n  - Enforced in: startup_policy_validation: apps/api/src/main.ts, response_option_cap: apps/api/src/hermes/hermes.service.ts, response_field_guard: apps/api/src/hermes/hermes.service.ts\n  - Verified by: packages/rules/src/hermes.invariants.test.ts, apps/api/src/hermes/hermes.policy.test.ts, apps/api/src/hermes/hermes.service.test.ts
- `maxOptions`: 3\n  - Enforced in: startup_policy_validation: apps/api/src/main.ts, response_option_cap: apps/api/src/hermes/hermes.service.ts, response_field_guard: apps/api/src/hermes/hermes.service.ts\n  - Verified by: packages/rules/src/hermes.invariants.test.ts, apps/api/src/hermes/hermes.policy.test.ts, apps/api/src/hermes/hermes.service.test.ts
- `singleStoreOnly`: true\n  - Enforced in: startup_policy_validation: apps/api/src/main.ts, response_option_cap: apps/api/src/hermes/hermes.service.ts, response_field_guard: apps/api/src/hermes/hermes.service.ts\n  - Verified by: packages/rules/src/hermes.invariants.test.ts, apps/api/src/hermes/hermes.policy.test.ts, apps/api/src/hermes/hermes.service.test.ts
- `forbidPaidPlacement`: true\n  - Enforced in: startup_policy_validation: apps/api/src/main.ts, response_option_cap: apps/api/src/hermes/hermes.service.ts, response_field_guard: apps/api/src/hermes/hermes.service.ts\n  - Verified by: packages/rules/src/hermes.invariants.test.ts, apps/api/src/hermes/hermes.policy.test.ts, apps/api/src/hermes/hermes.service.test.ts
- `forbidOutcomeOptimization`: true\n  - Enforced in: startup_policy_validation: apps/api/src/main.ts, response_option_cap: apps/api/src/hermes/hermes.service.ts, response_field_guard: apps/api/src/hermes/hermes.service.ts\n  - Verified by: packages/rules/src/hermes.invariants.test.ts, apps/api/src/hermes/hermes.policy.test.ts, apps/api/src/hermes/hermes.service.test.ts
- `proofModeAllowedInProd`: false\n  - Enforced in: startup_policy_validation: apps/api/src/main.ts, response_option_cap: apps/api/src/hermes/hermes.service.ts, response_field_guard: apps/api/src/hermes/hermes.service.ts\n  - Verified by: packages/rules/src/hermes.invariants.test.ts, apps/api/src/hermes/hermes.policy.test.ts, apps/api/src/hermes/hermes.service.test.ts

## Policy enforcement footprint

- startup_policy_validation: apps/api/src/main.ts
- response_option_cap: apps/api/src/hermes/hermes.service.ts
- response_field_guard: apps/api/src/hermes/hermes.service.ts

## Invariant test references

- packages/rules/src/hermes.invariants.test.ts
- apps/api/src/hermes/hermes.policy.test.ts
- apps/api/src/hermes/hermes.service.test.ts

## Non-configurable statement

These policies are fixed and cannot be overridden by customer configuration.