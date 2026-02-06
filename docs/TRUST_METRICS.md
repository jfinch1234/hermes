# Trust Metrics

Hermes tracks trust-aligned metrics instead of conversion.

## Metrics, meaning, and allowed actions
- Clarification rate
  - Indicates: how often Hermes detects meaningful variation.
  - Allowed action: improve data coverage or attribute detection if clarity is reduced.
- Repair invocation rate
  - Indicates: how often sessions trigger expectation repair.
  - Allowed action: review misunderstanding patterns; adjust explanations, not behavior.
- Abuse deflection rate
  - Indicates: frequency of ranking/optimization requests being deflected.
  - Allowed action: ensure refusal messaging is neutral and consistent.
- Invariant violation count (must always be zero)
  - Indicates: policy breach or implementation defect.
  - Allowed action: emergency fix only; document and stop pilot if unresolved.
- Proof access usage
  - Indicates: how often teams audit decisions in dev/staging.
  - Allowed action: ensure proof access remains available only outside production.
- Option collapse rate (cosmetic variation filtered)
  - Indicates: how often Hermes collapses superficial variation.
  - Allowed action: validate catalog data quality and variation semantics.

## Explicitly forbidden
- A/B testing
- persuasion metrics
- funnel optimization
