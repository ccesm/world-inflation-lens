# D3.3 — research-first publication review

**GO for owner review; NO-GO for production until explicit owner approval and a decision on residual repository exposure and accessibility deferral.** No merge, deployment, economic refresh, notification, automation, history rewrite or force-push was performed. PR #18 remains Draft with auto-merge disabled.

## Result and identities

The existing `#/research/ai-macro` route now presents **AI Macro Research / AI 宏观研究**: four research questions, supported findings, verified observations, complicating evidence, alternative explanations, unresolved questions, dated methods and original-provider acquisition instructions. This edition selects **zero economic numerical facts**. Dates, source identifiers and hashes remain as provenance. No source data proxy, full historical arrays, raw numerical tables, chart requirements or source-data downloads remain in the macro publication build.

| Identity | Value |
|---|---|
| Latest production base | `3dbf9353ada22cd33ac64ed158f3fd29e9ec3b66` |
| Preserved D3.2 PR head | `4b0e48c418930ba0bf575a2629879bf1ea67a6cf` |
| Normal latest-main merge | `1a67db953b2584faafa8e2c35c0e187e620d9e48` |
| Narrative implementation | `19e60397b547ff86a8c270f4eb91de67d13e984b` |
| Publication edition | `ai-macro-d33-2026-10-17` |
| Narrative manifest SHA-256 | `64295f79ed0d3d1e5f535a02e581718fd101abfd2108e96ea9373ce2aaec6f59` |
| Complete bilingual copy SHA-256 | `6a0c365b2497cfa0c373aff5b0da8cbbc3c0f795eb6834339edfe9d1580e04b4` |
| Original C2 research SHA-256 | `ac85a5fe4455112f95f83ae2a650a637578480cf8ec1feba8cd52db15b642ec7` |

The containing review commit adds browser negative tests and audit documents only; resolve its exact final identity with `git rev-parse HEAD` and the updated PR head. It is 9 ahead / 0 behind the production base. The new publication is deliberately **not byte-identical** to D3.2. Original research identities, values, missingness and source policies were preserved, rather than relabeled with the new narrative hash.

The 6,905-byte narrative/provenance manifest replaces the 93,328-byte numerical summary. The macro JS chunk is 46,453 bytes versus D3.2's 130,802 bytes; the 4,422,270-byte static history is absent. Local cold render measurements were 527–1,085 ms under concurrent tests, not a production benchmark. Existing shared application bundles remain large and contain unrelated economic histories; they were not altered.

## Exposure audit and original-research preservation

The [read-only audit](PUBLIC_EXPOSURE_AUDIT.md) preceded removals. It identified full static history, numerical summary embedded in JavaScript, build outputs, public branch/commit/raw/archive access, and earlier C2/D1/D2 exposure including SPF10 numerical research. Draft status does not provide privacy. The exact production history URL returned 404; currently listed artifact metadata contained no D3/D3.2-head upload. Artifact archives and unrelated release assets were not downloaded or deleted, so no universal cache/artifact absence claim is made.

Before publication files were removed, full C2 and D3.2 originals were copied to owner-readable local storage outside the worktree under ignored `.refresh/d33-private-research/`. Directory/files use 0700/0600 permissions. All 198 archived C2 research files were compared to original Git bytes. Full C2 remains 36 series / 12,949 records; the protected former public subset remains 35 series / 12,722 records / 273 missing values. No original value was edited or recalculated. The original full electricity workbook remains in the earlier external archive; this task does not claim to have copied it.

Original D3.2 worktree, historical handoffs and Git objects remain intact. Private local preservation does not revoke prior public access, provide encryption or constitute an off-device backup. No full numerical original is committed anew in D3.3. Source-specific permission files retain their historical review dates and hashes.

Repository exposure options are presented for approval: prospective build minimization (implemented), owner-approved forward branch/artifact cleanup, a separate sanitized publication repository, or coordinated historical cleanup with private evidence preservation. No branch/ref/release/artifact deletion, visibility change, migration, Git rewrite or force-push was performed. Old commits, PR refs, forks, clones and caches may remain accessible regardless of future cleanup.

## Findings and methodological boundaries

- **Energy & Infrastructure:** retained construction rose; selected states show divergent electricity sales/prices. This supports regional context, not a uniform national energy squeeze or an identified AI demand shock.
- **Investment & Financial Conditions:** broad investment and debt-securities stock rose in the retained quarter, while the last retained real-yield quote declined. Mixed frequencies/dates cannot establish synchronized tightening or an AI financing premium.
- **Productivity & Economic Growth:** output per hour and unit labor costs both rose in the retained quarter. Productivity improvement alone does not establish consumer-price disinflation or an AI contribution; GDP is outside the selection.
- **Inflation & Long-Term Expectations:** retained headline CPI/core PCE indices rose, which does not establish acceleration or AI causality. Survey expectations, realized prices and market compensation remain distinct. SPF10 is definition and official-source navigation only.

Every section includes source coverage, alternatives and unresolved questions. Directions and dates are checked against authenticated C2, without newly fetching economic data. E1/E2 remain observation/definition and within-series comparison labels, not causal grades. The publication introduces no correlation coefficient, forecast, probability, aggregate score or investment recommendation. [Source/evidence map](SOURCE_EVIDENCE_MAP.md) and [structure/minimal plan](STRUCTURE_AND_PLAN.md) give the exact claim/source relationships.

## Verification

| Check | Result |
|---|---|
| Locked root and isolated-engine installation; production build | PASS |
| Full `npm run verify`, all 18 entrypoints | PASS |
| Included weekly digest / AI CapEx / AI Infrastructure | 34 / 39 / 50 PASS |
| Default narrative acceptance without internal inputs | 43 PASS / 1 explicit optional internal-original skip |
| Narrative acceptance with authenticated internal originals | 51/51 PASS, no skips |
| Signal core, unchanged | 256 PASS / 2 existing unsupported-methodology skips / 0 FAIL |
| Signal pipeline/archive, unchanged repair | 71/71 PASS |
| Signal public, unchanged repair | 86/86 PASS |
| Production preservation | 368 protected files and all 32 economic data files match latest main; workflows/notification/Signal production code unchanged |
| Macro browser: 320/390/1280 × EN/ZH × light/dark | 12/12 PASS; zero macro history fetches, source-runtime requests or page errors |
| Channel keyboard focus; source disclosures; named AX landmarks/headings | EN/ZH PASS |
| Direct authenticated deep links | EN/ZH PASS |
| Tampered provenance and failed crypto in browser | PASS: article withheld, no numerical fallback |
| Old history URL in local candidate | No JSON/history payload; preview returns HTML SPA fallback |
| Macro-suite legacy route smoke | 26/26 PASS |
| Full existing browser acceptance | 12 homepage combinations / 324 route checks / 18 behavior checks PASS; zero page errors |
| Dependency audits | Root zero vulnerabilities; isolated Signal retains one MODERATE Ajv `$data` advisory, option not enabled; zero HIGH/CRITICAL |

Tests reject numerical fields and observations injected into the narrative contract, unknown sources/claims, missing counterevidence, incorrect channel ownership, SPF numerical use, unreviewed source URLs/editions and tampered publication/copy hashes. Actual `public/` and `dist/` trees are inspected with an asset allowlist and macro-payload/hash checks. Negative cases cover raw JSON, JS/HTML, escaped JSON, base64, gzip, renamed assets/downloads, source maps and unapproved archives. Real original C2/summary/history bytes fail these publication gates. Source-map-js 1.2.2 remains pinned; no dependency upgrade.

Two failed attempts are retained as evidence: initial browser channel focus was lost while asynchronous verification remounted the article; the page now restores explicit heading focus after authentication, without changing the shared router. The first Signal OP-12 run hit `ENOBUFS` reading the large uncommitted history-deletion diff; the unchanged test passes on the clean committed candidate. No guard was removed or enlarged to obtain a pass.

Historical numerical D1/D2/D3 acceptance files remain protected archival evidence. The active macro gate now enforces the owner-authorized narrative contract and original-data preservation; the old CLI public numerical writer fails before reading inputs or writing files. Pure historical projection exports remain for original research reproducibility. No CI-private research input is required for ordinary build/verification.

## Remaining questions and proposed next steps

**New build minimization: PASS. Production release: NO-GO pending owner review.** The previous static-history issue is avoided prospectively by absence of those numerical artifacts, not by asserting new redistribution permission. Old public copies, internal acquisition/storage terms and source-specific obligations remain for owner review. The [rights/accessibility review](RIGHTS_AND_ACCESSIBILITY.md) makes no legal clearance claim.

Formal spoken screen-reader acceptance remains **DEFERRED_BY_OWNER**. Native same-context provider links avoid the previous new-tab behavior. Automated keyboard/AX and inspected screenshots do not establish a VoiceOver/NVDA or WCAG pass. Spoken reading/disclosure/loading behavior remains unaccepted manually. Provider pages may change, and current data may differ from the retained vintage.

1. Review the exact D3.3 findings, bilingual copy, evidence map and new publication identity. Inspect the updated Draft PR and exact-head CI when available.
2. Choose a residual Git exposure/remediation policy; no historical cleanup is implied by approval of this page. Obtain any source-specific clarification required for already exposed copies.
3. Review the continued screen-reader deferral or complete manual acceptance. Preserve original research in owner-controlled storage and arrange durable backup as desired.
4. Only then explicitly approve the exact candidate for production. Fetch latest main, preserve later refresh/security/workflow changes and repeat affected tests if it moves. No production release is authorized by the passing tests or this report.

中文：D3.3 已将原历史数据浏览器改为四渠道研究出版物，不发布经济数值、完整历史、图表或下载。新出版物具有独立标识，原 C2 与 D3.2 数值和缺失值按原始哈希完整保留。新构建的数据最小化、完整仓库验证、Signal 三套测试及中英文浏览器/键盘/辅助功能树检查通过。旧公开 Git 历史仍可访问，后续处理需单独批准；正式屏幕阅读器验收仍延期。建议 GO 提交所有者审阅，生产保持 NO-GO，等待明确批准。
