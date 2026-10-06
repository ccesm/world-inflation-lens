# Continuous monitor qualification

Research qualification on `codex/ai-labor-continuous-monitor`, based on
`57f9b70352999a9464fb164e17df21075d6d61e9`. Monitoring, remote history writes
and email delivery have **not** been activated.

## Local results

| Check | Result |
|---|---|
| Monitor unit/integration fixtures | 82 passed; 0 failed; 0 skipped |
| Existing Phase 1 regression tests | 71 passed |
| Existing Phase 2 regression tests | 77 passed |
| Existing Phase 3 regression tests | 94 passed |
| Total | 324 passed; 0 failed |
| Application build | Passed; existing large-chunk warning remains |
| Application verify | Passed, including public/restricted artifact separation |
| Workflow YAML and gates | Parsed locally; timezone, manual defaults, permissions and separate writer gates checked |
| Accepted Phase 1–3 files | 464 protected file hashes unchanged |
| Pre-existing untracked design documents | All five unchanged and excluded from this commit |
| Production | Source, routes, refresh/deploy workflows, snapshots and version 1.1.0 unchanged |

The suite tests discovery, release cutoffs, HTTP identity reuse, no-new-data
handling, single-month incremental parsing, preserved missing October 2025,
revisions/withdrawals, independently failed sources, exact windows, partial
years, fixed samples, coverage/pretrend guards, method disagreement, earnings
comparability, persistence/recovery, alert deduplication and repeated health
incidents, immutable records, first-seen chronology, replay, bounded recovery,
semantic corruption rejection, compact output and disabled activation/email.

Two fresh processes independently initialized the accepted baseline. Their
deterministic result bytes were identical (103,270 bytes), with SHA-256:

`9c65350db439ee246408614201380bef40971f79a4ea2968084b861ab8c4b747`

Repeated evaluation reported `NO_ECONOMIC_CHANGE` and reused the same accepted
evaluation. Run/evaluation clocks are outside deterministic economic identity.
The frozen monitor specification hash is:

`95379563882affdb1dbec2754d83f6b6d2400e5bd36be9eaba715ff8844e2476`

The checked-in `current-monitor.json` is a **baseline qualification artifact**,
not evidence that continuous monitoring is already running. It is 118,009
bytes. Its reproducible local history package has 12 files totaling 281,904
bytes. Recovery packaging and semantic recorded replay passed. Replay before
first acceptance is unavailable; older implementation replay requires its
matching qualified code. Historical inspection contains four source/endpoint
rows (academic and Microsoft, 2023 and 2024), explicitly labeled
`CURRENT_VINTAGE_RECONSTRUCTION`, not a real-time backtest.

Current full-year occupational states are `INSUFFICIENT_EVIDENCE` because
2024 employed-weight coverage is 37.77% academic and 47.55% Microsoft, below
the frozen 50% guard. Earnings also remain not comparable. Numeric within-sample
changes and pretrends remain inspectable; no national displacement or
statistical-significance claim follows. Partial 2025/2026 years do not complete
annual persistence windows. No accepted Phase 3.5 was assumed.

## Live official-source checks

Live checks used the existing official BLS API and Census BTOS adapters and
official CPS file identities. No new qualified economic observation was found.
BLS calendar access returned HTTP 403; a seven-day backoff and official API
content-discovery fallback were exercised. No blocked OEWS endpoint was retried.
A not-yet-available September CPS ZIP returned 404 and was not fabricated.

A repeat live check experienced a JOLTS API failure. CPS, CES, BTOS and CPS
microdata checks continued, JOLTS explicitly retained its last-valid input,
and the previously accepted economic interpretation/hash remained unchanged.
Semantic validation passed. These live runs qualified source behavior; the
final deterministic hash above was produced after the final monitor rule
implementation was pinned. They do not establish that a genuinely new official
CPS month has been ingested: that path is separately tested with controlled
qualified fixtures, parsing one new month while reusing 139 prior months.

Measured local offline initialization was approximately 9 seconds and repeat
evaluation approximately 3 seconds; one repeat live check took approximately
5 seconds. Network, checkout and runner variance are excluded. GitHub planning
estimates are 2–5 minutes per ordinary run including tests and 3–8 minutes for
a new month, roughly 200–500 runner-minutes/month and 5–20 MiB history growth/year.
These are capacity estimates, not measured GitHub costs. No LLM/API inference
cost exists.

## Pending activation gates and limitations

No GitHub-hosted qualification, genuine scheduled run, durable remote-branch
write or email delivery is claimed. The separate writer is locally prepared,
not remotely qualified. The default variables remain disabled. Complete
[ACTIVATION.md](ACTIVATION.md) before enabling monitoring, including reconciling
Phase 1–3 dependencies on main, manual Linux dry-run, durable branch recovery
and write tests, production leakage checks and explicit variable approval.
Verify one genuine scheduled run after activation; approve email separately
only after stability is demonstrated.

No remaining HIGH implementation issue was found by these checks. MEDIUM
limitations remain: partial strict-sample coverage, unavailable design-based
uncertainty, earnings disclosure comparability, incomplete years, annual layout
qualification (including 2027), bounded historical revision discovery, and
pending GitHub runner/remote-history qualification. This monitor may correctly
remain inconclusive as data accumulate.

**READY FOR CONTROLLED MONITOR ACTIVATION** — implementation qualification;
the listed merge, storage, manual-run and activation gates remain mandatory.
