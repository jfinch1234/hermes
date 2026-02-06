# Pilot Release Cadence

## Release window
- Maximum once per week during pilots.

## Allowed changes
- bug fixes
- explanation clarity
- adapter correctness
- test coverage

## Forbidden during pilots
- behavior changes
- UI optimization
- new features

## Emergency fix protocol
Emergency fixes are allowed only for invariant violations. If an invariant is violated:
1. Pause pilot activity.
2. Apply minimal fix to restore invariants.
3. Document the incident and remediation.
4. Resume pilot only after verification.
