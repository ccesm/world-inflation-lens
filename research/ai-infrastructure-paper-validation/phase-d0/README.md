# Phase D0 handoff

Exact base: `362929adfae20b31d8044e5c9a10ae020f0c9eaf`. Independent production reference: `4a10e16f2d956fc25262c55da16a10c8d36fedab`. Branch: `codex/ai-infra-macro-integration-phase-d0`.

Start with PHASE_D0_INTEGRATION_ARCHITECTURE_REPORT.md, then PHASE_D1_IMPLEMENTATION_PLAN.md. The recommendation is static approved summary/history artifacts and a small native-frequency display adapter. No public projection or UI was implemented. Source-specific redistribution, actual browser performance and new UI acceptance remain D1 gates; causal attribution remains unqualified.

Offline D0 checks, Python standard library only:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 research/ai-infrastructure-paper-validation/phase-d0/validate.py
PYTHONDONTWRITEBYTECODE=1 python3 research/ai-infrastructure-paper-validation/phase-d0/test_phase_d0.py
npm run build
npm run verify
```

D0 validates all 571 inherited tracked files against its exact C2 lock and permits only new D0 files. Production-inspection.json is a committed SHA/hash inventory, allowing offline review without remote main or a temporary checkout. All listed production interfaces are byte-identical in C2, enabling offline anchor validation; the fifteen updated production data files are recorded separately.

Inherited phase tests that enforce their own allowed-path baseline must run in isolated clean checkouts of their qualified commits, rather than disabling their guards in D0. Validation-results.json records the exact test checkout references. Phase A and C2 ran in a clean C2 checkout. D0's two fresh processes also reproduce all C2 output hashes by calling the unchanged read-only library, without asking its CLI to write outside its permitted phase.

All eight requested deliverables, source terms review and tested structural/mutation checks are here. The extra production verify initially lacked a historical fixture in the shallow clone; fetching full history resolved the environment limitation, with no code change. Both reference builds/verification pass. No browser implementation acceptance is claimed.

Do not merge this research lineage into main, implement D1, deploy, schedule or send notifications. D1 requires separate authorization and a fresh production baseline.
