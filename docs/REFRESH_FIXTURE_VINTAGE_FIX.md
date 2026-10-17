# Data refresh verification: fixed-vintage test isolation

Incident: [scheduled update 39004373760](https://github.com/ccesm/world-inflation-lens/actions/runs/39004373760), October 16, 2026 (Los Angeles). Production base: `168c171973a970f0b8f7ca2d0fbae4c8717046da`.

The real TIC download advanced from the September 16 file / July observation to the October 16 file / August observation. After staging that valid candidate, `verify-refresh.mjs` copied it into its disposable test baseline but replayed the September archived raw response. The legitimate timestamp-regression guard then fired before the deliberately failing build, so the test never reached the rollback assertion it expected. The outer refresh transaction restored the previous bundle; deployment was skipped. `verify-international.mjs` had the same latent cross-vintage assumption at its adapter comparison.

The repair gives the archived international responses one explicit test clock, `2026-10-02T23:59:00Z`. Only the refresh test's disposable international baseline and summary are initialized from those same raw responses before recording rollback originals. Current committed production snapshots still undergo schema, identity and mechanically generated summary validation. Archived adapter results are compared with their own raw fixture parses rather than the latest production history.

An additional real-CLI negative case gives the temporary prior TIC bundle a deliberately newer source-version timestamp, then submits the unchanged older fixture. It must fail with `TIC source file timestamp regressed` and preserve every prior snapshot and ledger byte. Economic observations and archived raw inputs are not modified by that case. Existing invalid currency, missing country-year, failed-build rollback, successful refresh and idempotency cases remain active.

## Validation

- Before repair: offline reproduction with synthetic newer TIC metadata failed with the incident's timestamp-regression error; source bytes were unchanged.
- After repair: the identical reproduction passes, still preserving the source copy.
- Focused `node scripts/verify-refresh.mjs` and `node scripts/verify-international.mjs`: PASS.
- `npm run build` and full `npm run verify` on the production-based branch: PASS.
- Independent live positive control: one direct official Treasury Table 3 response, source update `2026-10-16T20:07:20.000Z`, coverage through `2026-08`, retrieved `2026-10-17T05:32:55.749Z`. Raw response SHA-256: `8f5029c4b9452626554df0fc6b203d6f633ed8696788379dd61254e7f001eda9`. A disposable copy stages that parsed bundle and derived summary; full build and verify both pass. The document remains outside Git and this test does not publish candidate data.
- Diff inspection: production parsers/comparators, raw archived fixtures, `data/`, `src/`, `public/`, dependencies and workflow files are unchanged.

This change is confined to verification code and this handoff. A separately approved merge is required before the production scheduled workflow receives the fix. No workflow rerun, deployment or email is initiated by this repair. Genuine source-version regressions, definition changes and invalid observations must continue to fail closed.
