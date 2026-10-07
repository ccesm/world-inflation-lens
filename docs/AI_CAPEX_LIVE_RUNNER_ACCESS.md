# AI CapEx Phase 2D.1 — live runner access qualification

Research base: `05623ffa6cbe0d4ba9f5c2fc0a5d3986c5ac5c13`. This branch is deliberately separate from production. The frozen accepted panel ends at 2026Q2. No new economic data is accepted by this tool.

## Purpose and boundaries

Phase 2D encountered SEC/issuer archive access failures. This phase distinguishes access to discovery pages from retrieval of real financial documents. A 403 is an access failure, not proof that no release exists. A 200 index page is not proof that a financial document can be fetched.

The runner uses Phase 2D's descriptive project User-Agent, official issuer/delegated-tenant policy, at least one second between requests, 30-second timeout, 25 MB streaming limit and at most three redirects. Every redirect is revalidated. 403/429 suppress subsequent requests to the same host in the run; Retry-After is recorded, with no automatic retry. No browser cookies, proxies, logged-in sessions, search-engine feeds or API secrets are used.

## Positive controls

Six control identities are loaded directly from the pinned Phase 2A source manifest: Microsoft FY26Q4 release, workbook and call; Alphabet, Amazon and Meta 2026Q2 release PDFs. The explicit SEC document probe uses the existing Alphabet Q2 10-Q reference; that HTML URL has a qualified filing reference but no pinned raw hash, so a successful response still requires review. The separate Meta annual-report SEC index proves index access only.

Controls run before current discovery. Validation checks MIME and HTML/PDF/XLSX structure, issuer name, native financial content and observation-period markers. Workbook ZIP expansion and PDF page counts are bounded. A known-document hash match yields `PASS_EXISTING_HASH`; valid structure with changed bytes yields `CHANGED_BYTES_REVIEW_REQUIRED`. Existing accepted objects are never replaced. Unhashed manual documents cannot qualify a runner automatically.

## Reproduction

Use Node 24.19.0 and Python with `pypdf==6.10.0` and `openpyxl==3.1.5`.

```sh
WIL_AI_CAPEX_PYTHON=python3 node research/ai-capex-monetization/refresh/access/qualification.mjs \
  --runner LOCAL_MAC --as-of 2026-10-07 \
  --out research/ai-capex-monetization/refresh/outputs/access-local
node --test research/ai-capex-monetization/refresh/tests/access.test.mjs
```

`--as-of` must be the explicit UTC date of the live run. Fixture tests use fixed clocks. Set `WIL_AI_CAPEX_CACHE` or `--cache` to an external content-addressed cache; the default remains `~/Public/wil-ai-capex-cache`. Raw objects never go into Git or Actions uploads. CLI report outputs must be under ignored refresh outputs or the system temporary directory.

## Runner assessment

The committed compact qualification report is the authoritative result. Discovery and document-fetch states remain separate for each company. Primary-runner qualification requires all four companies to have both workable official discovery and a validated core financial-document route. Workbook access can qualify Microsoft's financial-document route; it does not qualify discovery or management events. Cross-runner coverage is allowed only when actual independently qualified routes cover all four companies.

Operational timestamps, OS, Node version and latency belong to access telemetry only. `accessIdentity` hashes deterministic source outcomes without timing/new-cache-object noise. It is not an economic artifact hash. This phase generates no new economic identity, recognized AI-only revenue or AI return estimate.

## Manual official-source seed

An operator may provide a JSON array through `--seed-file`:

```json
[{"company":"GOOG","url":"https://s206.q4cdn.com/479360582/files/doc_financials/2026/q2/2026q2-alphabet-earnings-release.pdf","expectedQuarter":"2026Q2"}]
```

Seed use is explicit in the receipt. An issuer-host URL must pass normal official-host checks. A CDN seed requires delegation already present in the qualified manifest; operators cannot invent a new delegation. Known hashes are checked. New/unhashed documents remain review-required and subsequently need Phase 2D native extraction, accounting qualification and explicit human promotion. A seed is an operator-assisted fetch, not automated discovery qualification.

## GitHub qualification

The added `AI CapEx Refresh Access Qualification` workflow is dispatch-only, exact-research-branch gated, `contents: read`, credential persistence disabled. It uploads only `access-report.json` with 30-day retention. It cannot commit, deploy, email, schedule, update production or promote data.

GitHub requires a dispatch workflow to be registered on the default branch before dispatching a different ref. See [GitHub's manual workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow). Direct dispatch of the new filename returned HTTP 404 on 2026-10-07. Actual GitHub-hosted qualification therefore uses the already-registered `signal-engine-shadow-qualification.yml` dispatch endpoint with this research ref. Only the research copy gains an independent `ai-capex-access` job gated to this exact branch. The original Signal job is byte-for-byte unchanged and its branch condition excludes this branch, so it does not run. Production main and its workflow files remain untouched. The standalone access workflow remains dispatch-only and prepared for a future separately approved registration. This bootstrap does not authorize a production merge.

```sh
gh workflow run signal-engine-shadow-qualification.yml \
  --repo ccesm/world-inflation-lens --ref codex/ai-capex-live-runner-access -f mode=normal
```


## Access results and recommended routes

Final local/Actions observations, repeatability, company routes and unresolved discovery gates are recorded below and in the committed JSON report. Official issuer releases may be operational primaries when SEC is blocked, but accounting and provenance standards are unchanged. No source-order recommendation is inferred from institution reputation alone.

## Remaining boundaries

No schedule, email, production write or unattended promotion is implemented. Current discovery links are candidates only; blocked or unsupported discovery never means `NO_NEW_DISCLOSURE_CONFIRMED`. Unknown publication dates remain unknown. Manual seeding is a fallback requiring human review, not a repaired automatic discovery adapter. Access qualification does not qualify a new quarter or AI ROI.

## Completed live qualification — 2026-10-07

Two separated local network runs completed. GitHub attempt [37670921561](https://github.com/ccesm/world-inflation-lens/actions/runs/37670921561) passed its tests but stopped before any source request because the output guard did not recognize GitHub's runner temporary directory. The guard was repaired, with tests rejecting checkout writes and symlink escapes. The second attempt, [37671307858](https://github.com/ccesm/world-inflation-lens/actions/runs/37671307858), completed successfully on Ubuntu 24.04 / Node 24.19.0 / Python 3.12.14. The original Signal job was skipped in both runs. No more access runs were made.

| Source family | Local Mac | GitHub Actions |
|---|---|---|
| SEC submissions | ACCESS_BLOCKED, 403 | ACCESS_BLOCKED, 403 |
| SEC filing document/archive | ACCESS_BLOCKED, 403 | ACCESS_BLOCKED, 403 |
| Microsoft archive | NO_STATIC_LINK | NO_STATIC_LINK |
| Microsoft known release | REVIEW_REQUIRED: changed bytes | REVIEW_REQUIRED: changed bytes |
| Microsoft workbook | PASS_EXISTING_HASH | PASS_EXISTING_HASH |
| Microsoft earnings call | REVIEW_REQUIRED: changed bytes | REVIEW_REQUIRED: changed bytes |
| Alphabet archive | ACCESS_BLOCKED, 403 | ACCESS_BLOCKED, 403 |
| Alphabet issuer q4cdn PDF | PASS_EXISTING_HASH | PASS_EXISTING_HASH |
| Amazon archive | ACCESS_BLOCKED, 403 | ACCESS_BLOCKED, 403 |
| Amazon issuer q4cdn PDF | PASS_EXISTING_HASH | PASS_EXISTING_HASH |
| Meta archive | ACCESS_BLOCKED, 403 | ACCESS_BLOCKED, 403 |
| Meta issuer q4cdn PDF | PASS_EXISTING_HASH | PASS_EXISTING_HASH |

These four matching financial controls had the same accepted hashes across both local runs and the hosted network run. Microsoft HTML changed, including across runners; this may include mutable page delivery but has not been reviewed as immaterial. No accepted object or source manifest was replaced. The first local call check did not recognize the native “Fiscal Year 2026 Fourth Quarter” wording; the second run recognizes that period label and still correctly requires review of changed bytes.

Both environments are **PARTIALLY_QUALIFIED**. There are **zero qualified discovery families**. Neither a primary runner nor a qualified split-runner solution exists yet. Blocked discovery is not evidence of absence: no `NO_NEW_DISCLOSURE_CONFIRMED` claim was made, and no candidate quarter was discovered or accepted. Similar failures in both environments do not identify their root cause (network, geography, server policy or client behavior). There is no basis to claim GitHub fixes the access problem.

Recommended independently qualified document paths, based on observed results:

- Microsoft: official financial workbook; release/call HTML requires identity review; SEC currently blocked.
- Alphabet: existing issuer-bound q4cdn release PDF; archive discovery and SEC unqualified.
- Amazon: existing issuer-bound q4cdn release PDF; archive discovery and SEC unqualified.
- Meta: existing issuer-bound q4cdn release PDF; archive discovery and SEC unqualified.

GitHub is practical for controlled known-document diagnostics, with no personal-session dependency. Neither runner is recommended as a quarterly-refresh primary or secondary yet. Do not implement orchestration to hide missing discovery coverage. The next repair should qualify official static/embedded-source discovery adapters or a reviewed operator-seeding policy, separately for each issuer. The present manual seed accepts known delegated URLs; new CDN URLs need an explicit qualified delegation record before use. This deliberately restrictive fallback has not qualified a new quarter.

## Validation and protection

Local regressions: **369 passed, 0 failed**: Phase 1 48; Phase 2A 65; Phase 2A.1 40; Phase 2B 73; Phase 2D 65 + 7 Python; prior Python 28; Phase 2D.1 43. Hosted safeguards: 43 passed again. Tests distinguish discovery/fetch asymmetry, 200 challenges, MIME/issuer/period mismatch, changed hashes, blocked SEC with issuer success, CDN/seed rejection, explicit clocks, source isolation, runner classification, split-runner completeness, temporary-path/symlink guards and fresh-process deterministic content. YAML syntax was parsed separately.

`npm run build` and `npm run verify` pass on the inherited research checkout. Its application version remains the inherited 1.1.0; it was not rebased onto the production app. Production main remains `4b28c278d99c39d022f5336d634aff4a9b5a4a41`, version 1.3.0, with public snapshot SHA `8891e6b7dca9317e3d2400bdd3749c54425ff1c0385c1f2151e2593c92227c3a`. All production paths, existing Pages workflow, Signal code and accepted research inputs are unchanged relative to the specified research base.

The successful Actions artifact is one 22,130-byte JSON report (compressed upload approximately 2.9 KB), retained 30 days. No raw filings were uploaded. Successful logs contain no detected credential/token pattern, personal Mac path or email address. Standard GitHub runner paths appear in workflow operational logs; none appear in the report. The external local cache grew from 89 objects / 36,766,021 bytes to 93 objects / 38,233,814 bytes, preserving existing objects.

Fixed-input tests produce identical access content and company decisions across fresh processes. Real network HTML is explicitly not claimed deterministic. Operational clocks and latencies never create economic identity. No production snapshot, schedule, email, API secret, AI-return calculation or accepted quarter was added.

A successful diagnostic workflow means the checks completed; it does not mean source access passed. The machine-readable qualification decision remains fail-closed.

Final decision: **LIVE RUNNER ACCESS STILL REQUIRES REPAIR**.
