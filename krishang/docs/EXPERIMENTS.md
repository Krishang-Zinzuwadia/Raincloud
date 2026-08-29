# Experiment persistence

Issue #9 is resolved by `experiments` in migration `0007_experiments.sql`.

- **Table:** `experiments`
- **Arms:** `director`, `human`, and `random_baseline`; the baseline is stored with
  every other arm rather than in a separate table.
- **Retention:** two years, recorded in `retained_until`. The scheduler should prune
  expired rows; records are not unbounded.
- **Reporting:** consumers must include `EXPERIMENT_CONFOUND_NOTICE` from the shared
  contracts package. Reports show delta and sample sizes, never a significance claim.

The unique `(deployment_id, arm)` index prevents duplicate results for the same
deployment and experiment arm. Window and count constraints make invalid measurements
unrepresentable in the database.
