# D3 — AI Macro Monitor release preparation

**RELEASE PREPARED — OWNER APPROVAL REQUIRED.** This is a production-based release candidate, not a published release. Actual manual screen-reader acceptance is **DEFERRED_BY_OWNER**, not formally passed. No full accessibility conformance is claimed.

## Integration and identity

Repository `ccesm/world-inflation-lens`; latest fetched/observed main `4a10e16f2d956fc25262c55da16a10c8d36fedab`. Exact D2.1 source `9c65c0cfdf1dc5ac02906a508a5bd9b3d61b29b3`. D3 `codex/ai-macro-monitor-phase-d3` was created in an isolated worktree directly from current main. No wholesale research merge, cherry-pick/rebase/reset of main, dependency redesign or snapshot refresh. Shared workspace user files remain intact.

The selected patch imports only the validated React/Vite macro page, SVG chart, scoped CSS, native data contract/loader, bilingual copy/navigation, fixed public summary/history/identity, offline projection and active source-specific publication checks. Historical D1/D2 reports, full research trees, old acceptance suites and private fixtures are not imported. The preserved D1 source assessment is explicitly historical local-research evidence; D2.1 mixed policy remains the authoritative public permission gate.

Seven existing anchors change: `src/App.jsx`, `src/utils/routing.js`, `src/i18n/architecture.js`, `src/data/researchArchitecture.js`, `src/data/researchLinks.js`, `package.json` (verification command only), and the single patched source-map-js lock entry. All other implementation is a new macro namespace. Version remains 1.4.1. No existing economic value, Signal Engine/AI Labor/AI CapEx/AI Infrastructure implementation, notification, deployment or automated refresh configuration changes.

Dataset schemas `AI_MACRO_PUBLIC_2` / `AI_MACRO_HISTORY_2`, snapshot 2026-10-09, copy `D21_COPY_1`:

- 12 conceptual indicators, 11 numerical indicators, 35 numerical series, 12,722 records and 273 missing levels; 10 reviewed numerical source identities.
- Canonical public projection hash `1a0a3e41fdb6b5ab3bfcfa4bfae1f6891dd4ce82b0d82e00142542932b02f13b` (excludes own hash).
- History exact SHA-256 `6bfbc2c89362cc39d3ddc7bd50044866d3251059998bcea76196878aa1dcfeb3`; 4,422,270 bytes.
- Summary exact file SHA-256 and byte size, selected-file identities, current-main protection and intended-build identities are recorded in `release-candidate-manifest.json`. Its implementation SHA identifies the tested code; the containing manifest-only audit commit is resolved by `git rev-parse HEAD`, avoiding a self-referential Git hash.

D2.1 summary, numerical history, identity and copy are copied byte-for-byte. No economic recalculation or live-source refresh. Full research data (12/36/12,949/360) remain separately authenticated and outside the release tree. Optional authenticated original-input tests independently reproduce the public subset; default production verification authenticates the frozen public artifacts without private files, prior research commits or network access.

## Public behavior and source boundary

Route `#/research/ai-macro` uses existing lazy routing, bilingual shell/context and static same-origin data. Four sections: Energy & Infrastructure, Investment & Financial Conditions, Productivity & Economic Growth, Inflation & Long-Term Expectations. Every conceptual name is discoverable. Eleven numerical indicators retain the original date/unit/frequency/revision/missingness semantics, E1 observations, E2 within-series arithmetic and E0 unverified mechanisms. Energy captures ending 2025 are not labeled current October 2026 values. No AI-specific energy attribution, correlation, forecast, aggregate score or new indicator.

SPF10 uses a qualitative branch before numerical-series dereference. It explains median ten-year annual-average CPI forecasts, forecast versus realization, survey versus market compensation, and CPI versus the Fed's PCE objective. It makes no numerical/latest-trend claim. EN **View Official SPF10 Data** / ZH **查看官方 SPF10 历史数据** links directly to the official Philadelphia Fed landing page, `_blank` / `noopener noreferrer`, without embedding/retrieving its workbook. No endorsement or numerical redistribution permission is claimed. Underlying rights remain **UNRESOLVED** / presentation **EXTERNAL_SOURCE_ONLY**. There is no download feature, runtime economic API, proxy, LLM or database.

Numerical source permissions are ten independent exact reviewed hashes, required attributed display/static-history/derivative scopes, evidence and dates. Publication tests reject altered source coverage, hash, permission, attribution or intended use; a boolean cannot waive the gate. Public summary/history are separately hash checked, allowlisted and scanned. Injected SPF values/all-null series, workbook links and unauthorized public artifacts fail safely. Snapshot/history failures preserve last-valid presentation or fail closed and never synthesize values.

## Accessibility decision and security

`MANUAL_SCREEN_READER_ACCEPTANCE = DEFERRED_BY_OWNER`. Owner reports a brief informal VoiceOver check without an obvious issue; full cases were not completed. Formal screen-reader PASS and WCAG conformance remain unclaimed. Automated keyboard/AX, visible focus, bilingual names, semantic tables, chart text alternatives and reading order are retained. Residual spoken announcement/focus/new-tab behavior remains a transparently deferred acceptance risk.

Clean isolated installation resolves source-map-js 1.2.2 via Vite 7.3.6 / PostCSS 8.5.28 (`^1.2.1`). The selected lock patch changes only this package's version/tarball/integrity; no other upgrade. Current `npm audit --json` reports zero vulnerabilities. This is a dated audit, not a permanent guarantee. Full build/verify run on the clean patched install.

## Qualification and workflow safety

D3 tests validate actual public artifacts and adapted production contracts. They no longer require historical branch commits or macOS-specific temporary paths during CI. Original D2.1 independently remains validated in its exact source checkout; its old Git scope assertions are not treated as compatible with a newly production-based branch. The historical C2 input is optional and never installed into public assets. Full repository verification continues to test existing snapshots, notifications against mocks (no mail), rollback and all established public research modules.

Eight actual-candidate browser combinations cover 390/1280px × EN/ZH × light/dark, all eleven numerical indicators, qualitative SPF, missing CPI, provenance, focus/pagination, blocked/tampered history and all 26 preexisting routes. Dedicated AX/keyboard checks test zero history requests on fresh SPF selection and safe return to numerical charts. Exact counts and results are in `validation-results.json`; no claim is made that software tests establish AI macro causality.

Every existing workflow is unchanged. `deploy.yml` triggers on main push, existing daily schedule or manual dispatch, and production build/notify/status are gated to main. It has no PR trigger. Only `signal-engine-tests.yml` runs on PRs; it has `contents: read`, installs isolated Signal dependencies and runs tests, with no Pages deployment, mail, write or publication step. Feature push and Draft PR therefore cannot deploy under inspected repository workflows. GitHub's current registered workflow inventory is also checked before PR creation. No new automatic task or workflow is added.

## Handoff

The reviewed changed-file list, dataset identities, security audit and exact-build results are recorded in the release manifest and Draft PR. Keep the PR draft; no auto-merge. To release later, explicitly approve that candidate, re-fetch then-current main, preserve any bot updates, rebuild/reverify if the head changes, review the precise final SHA and allow existing main Pages publication only after owner authorization.

Deployment/smoke/rollback instructions are the updated `../phase-d2/PHASE_D3_DEPLOYMENT_PLAN.md`. An approved rollback must use a new revert commit, preserve unrelated bot updates and retain the security patch where practical. Stop after D3 release preparation.
