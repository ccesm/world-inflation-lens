# Phase D3.4 — final release readiness and historical exposure review

Assessment: 2026-10-17, America/Los_Angeles. **Recommendation: CONDITIONAL GO for owner review; NO-GO for production until the decisions below are explicitly resolved.** No new macro research, economic values, conclusions or source permissions were introduced.

| Independent decision | Assessment |
|---|---|
| Technical readiness | Local required checks PASS on integration `93dc3d559654c04fe675a68434d3a6b6b4278ded`. Final branch-head GitHub SUCCESS must match the immutable SHA in the Phase D3.4 receipt in [PR #18](https://github.com/ccesm/world-inflation-lens/pull/18). This report is effective only with that matching receipt. |
| Prospective publication readiness | PASS for the AI Macro narrative publication boundary. Source and actual compiled output exclude the retired macro histories, numerical summary and explorer. Other World Inflation Lens modules retain their own historical-data contracts. |
| Residual historical exposure | UNRESOLVED. Older public branches, commit URLs and archives remain accessible. No independent private backup exists, as confirmed by the owner. Historical source-permission questions require owner acceptance or remediation; successful build checks do not resolve them. |

## 1. Git baseline, protected work and integration

- Reviewed D3.3: `abcedb2c049b01769fb0c5423370661e466b4ee5`; original production base `3dbf9353ada22cd33ac64ed158f3fd29e9ec3b66`.
- Latest fetched production main: `03413caa9868f4608e828ad94d3f57b490e03380`.
- The sole new main commit is `03413ca`, **Publish bilingual China monetary strategy research (#22)**. It adds the publication, global monetary order entry, shared routes/navigation and its verification checks. It changes no economic snapshot, Signal production logic, notification workflow or dependency lock.
- D3.4 normal two-parent merge: `93dc3d559654c04fe675a68434d3a6b6b4278ded`. Parents are the reviewed D3.3 head and current main. Before integration the feature was 9 ahead / 1 behind; after merge, 10 ahead / 0 behind. With the final D3.4 documentation commit it is 11 ahead / 0 behind, provided main has not subsequently moved.
- The final report commit identifies itself through `git log -1 --format=%H -- docs/ai-macro-release/phase-d34/PHASE_D34_RELEASE_READINESS.md`. Its full SHA, final live branch comparison and exact-head workflow result are recorded in the PR handoff receipt after pushing; embedding a commit's own SHA or future workflow ID in its tree would be self-referential.
- PR #18 must remain **OPEN / DRAFT**, auto-merge **disabled**. The handoff receipt verifies these again after CI.

Assessment began read-only: fetched references, inspected relevant worktrees, read every D3.3 handoff and compared main before creating `.refresh/d34-candidate` on `codex/ai-macro-release-phase-d34`. The primary `Y` worktree contains owner modifications and untracked research/video work; it was untouched. Existing D3.2, Signal repair, D3.3, main-control, operator-refresh and CoreWeave worktrees were left intact. The independent storage clone's pre-existing no-checkout index state was not repaired or reset. No original handoff was edited.

Two integration conflicts were resolved by retaining both additions: `package.json` keeps China's checks and appends the AI Macro verifier; `routing.js` keeps both China routes and the AI Macro route. App/navigation merged normally. The [scope audit](verify-scope.mjs) authenticates **378 protected production files**, all **32 economic data files**, workflow/notification/weekly-digest logic, original D3.3 evidence and publication bytes. Shared shell changes are limited to the required route/test union. All original PR #19 fixture repairs and subsequent production refreshes are preserved.

## 2. Historical exposure inventory

Evidence: [exposure.json](exposure.json), [branches.json](branches.json). Raw probes used anonymous requests; only metadata, aggregate counts and hashes are published here. The archive was checked in memory; original observations are not republished in this report. Access findings are point-in-time and do not establish the absence of other copies.

| Surface | Classification | Evidence and limits |
|---|---|---|
| C2 and D0 public branch tips | CURRENTLY_ACCESSIBLE | C2 analysis and observations CSV remain in their Git trees; raw C2/D0 analysis responds 200 and matches original SHA-256. C2 holds 36 series / 12,949 observations. |
| C1M/C2/D0 SPF fixture | CURRENTLY_ACCESSIBLE | `phase-c1m/fixtures/SPF10.xlsx.gz` remains in all three trees; anonymous C2 raw fixture responds 200. Numerical SPF research remains historical exposure; no SPF values are quoted here. |
| D1 and D2.1 branch tips | CURRENTLY_ACCESSIBLE | D1's earlier history and D2.1's D3.2 history respond 200. D3.2 history is 4,422,270 bytes, 35 series / 12,722 observations; identity matches the preserved original. |
| D2 current summary / prior full projection | HISTORICAL_REFERENCE | Current D2 summary is a 311-byte release-hold marker, not the former numerical summary. Its earlier numerical implementation remains in history; do not misclassify the current marker as a full dataset. |
| Original D3.2 commit and raw summary/history URLs | CURRENTLY_ACCESSIBLE | Commit `4b0e48c…`: both raw files respond 200 and match protected summary/history hashes, despite their removal from the new tree. |
| PR #18 history and earlier commits | HISTORICAL_REFERENCE | Live PR head/merge refs remain public; old D3.2 commits remain in the release lineage and their raw objects are accessible. Draft status provides no confidentiality. |
| Current D3 branch and PR head/merge old-history URL | NOT_FOUND | Exact retired history path returns 404 at all three current refs. This says nothing about older PR commits or other paths. |
| GitHub-generated C2 source archive | CURRENTLY_ACCESSIBLE | Anonymous codeload archive retrieved; contained C2 analysis hashes to the original identity. Other downloaded archives, clones and caches cannot be recalled by a forward commit. |
| Actions artifacts | NOT_FOUND for excluded histories in inspected Pages artifacts; NOT_VERIFIED for remaining archive contents | Complete current listing: 37 artifacts. All 7 `github-pages` archives, 242 member files, inspected with the existing excluded-macro scanner: PASS; no macro-named paths. Other 30 artifact contents were not downloaded; names concern status/CapEx, with no macro candidate listed. Expired/deleted/unlisted artifacts are not proven absent. |
| Releases and attached assets | NOT_FOUND in current metadata; NOT_VERIFIED for asset contents | All 13 releases / 62 attached assets listed. Names concern other research/media/archive work; no AI Macro release is listed. Contents were not broadly downloaded or altered. Git-generated source archives remain a separate exposed surface. |
| Current production website | NOT_FOUND at exact retired macro URL | Published Pages returned 404 for the D3.2 history path. D3 remains unmerged. Retained production Pages archives passed the payload scan; alternate URLs/caches/old deployments are not exhaustively disproven. |
| Forks, third-party clones, mirrors, caches and previously saved archives | NOT_VERIFIED | GitHub reports zero current repository forks; that does not establish the absence of independent copies. |

No branch, tag, commit, artifact, release, evidence or public reference was deleted. Repository visibility remains public. Earlier copies must not be described as made private by this redesign.

## 3. Private research preservation and backup gap

[private-preservation.json](private-preservation.json) records six verified file identities. The owner-readable, Git-ignored original preservation directory has mode 0700 and its research files 0600. All file sizes and SHA-256 values match the D3.3 preservation manifest. The C2 archive's **198 files** and D3.2 archive's **27 files** were compared byte-for-byte to their original Git objects, including parsers, fixtures, methodology, identities and prior permission/release documentation.

| Protected identity | SHA-256 |
|---|---|
| Full C2 analysis | `ac85a5fe4455112f95f83ae2a650a637578480cf8ec1feba8cd52db15b642ec7` |
| Original D3.2 history | `6bfbc2c89362cc39d3ddc7bd50044866d3251059998bcea76196878aa1dcfeb3` |
| Original D3.2 summary | `09247e08d0a45ee96c74cf6ce0646d21bc2ef3e32ff78feb271ff1db07a27688` |

Full C2 retains 36 series, 12,949 observations and **360 null levels**. The original D3.2 subset retains **11 numerical indicators**, 35 series, 12,722 observations and **273 null levels**; all subset records and source definitions match C2. Original October 2025 CPI missingness remains null. No interpolation, fill, splice or value change occurred. Original SPF data remains in the preserved C2 artifact; the public article remains external-source-only.

**Independent durable backup: ABSENT, confirmed by owner.** A configured Time Machine destination is not evidence that these ignored files were backed up. This local ignored directory is a verified preservation copy, not a complete backup. The original methodology also refers to a separate external full electricity workbook archive; its existence/identity was not independently established here, and it must not be represented as included in the 198-file archive.

Proposed safe procedure, requiring an owner-selected private destination: copy the preservation directory and supporting manifest to an encrypted external volume plus a separate owner-controlled versioned private backup; retain owner-only access and keys separately; verify every SHA-256 after transfer; restore into a temporary private directory and re-run the 51 authenticated tests and archive comparisons. Locate and authenticate the separate original electricity workbook archive. Do not fetch a revised workbook as a substitute for the retained vintage. No backup was uploaded or created in an unapproved destination.

## 4. Minimal-risk remediation decision memo

| Option | Benefit | Cost / residual exposure | Recommendation |
|---|---|---|---|
| A — Forward-only minimization | Keeps the new build narrative-only; preserves reproducible evidence and current production integration. | Old Git/PR/raw/archive copies remain accessible. Requires explicit owner handling of historical rights/exposure. | **Recommended immediate policy**, with independent verified private backup first and documented historical-exposure acceptance or a separately authorized remediation plan. |
| B — Limited public reference cleanup | Can reduce discovery through obsolete C1M/C2/D0/D1/D2.1 branches or confirmed macro artifacts after approval. | Ref deletion cannot erase underlying commits, PR references, clones or caches. Current inspected Pages artifacts do not justify deletion. | Optional follow-up only after backup and a specific owner-approved list; delete nothing now. |
| C — Separate sanitized publication repository | A clean narrative tree without research ancestry can reduce future accidental publication and simplify a dedicated publication boundary. | Migrating the whole mixed-module site adds hosting, URL, maintenance and permission decisions. Existing repository exposure survives; unrelated module data contracts still apply. | Consider for a future publication/research separation; not required for this release and not a remedy for old copies. |
| D — Coordinated historical cleanup | May reduce known reachable copies if a concrete rights requirement warrants broader action. | Disruptive reference/history/PR coordination; needs private evidence preservation, explicit approval and possibly provider/GitHub assistance. Cannot promise recall of external copies. | Reserve for a substantiated requirement; not justified as an automatic release step. |

Owner decision: accept A's bounded historical exposure and resolve any source-specific permission concerns, or authorize a separate, scoped B/D remediation after backup. Absence from a current listing or a 404 is not proof of erasure. No legal clearance or expanded redistribution permission is claimed.

## 5. Final publication audit

Route `#/research/ai-macro` retains **Energy & Infrastructure**, **Investment & Financial Conditions**, **Productivity & Economic Growth**, and **Inflation & Long-Term Expectations**. Both languages retain research question, evidence-supported finding, verified observations, counterevidence, alternative explanations, unresolved question, limitations, research vintage, original provider, official dataset identifier and independent acquisition instructions. The [D3.3 source/evidence mapping](../phase-d33/SOURCE_EVIDENCE_MAP.md) remains byte-identical.

E1 remains definition/scope evidence; E2 remains a within-series descriptive comparison. No new causal identification, estimated AI contribution, correlation, forecast, score, probability or investment conclusion is introduced. Existing mixed dates, aggregate coverage, real-flow versus nominal-stock distinctions, preliminary construction status, index-level versus inflation-rate distinction and missingness cautions remain intact. SPF10 is **EXTERNAL_SOURCE_ONLY**: no level, trend, workbook, downloadable history or numerical comparison.

Actual `public/` has 3 permitted files and actual production `dist/` has 40 permitted files. No old macro history namespace, numerical summary JSON, source download, raw table, historical series chart, numerical fallback, API proxy, runtime economic request, source map or hidden archive is present. Negative tests reject original datasets in JSON, JavaScript, HTML, escaped JSON, base64 and gzip, renamed build assets, altered provenance and fabricated identities. Invalid authentication withholds the article. The macro chunk is 46,453 bytes; changed asset filenames reflect the shared integration, not revised research.

The publication remains `ai-macro-d33-2026-10-17`, SHA-256 `64295f79ed0d3d1e5f535a02e581718fd101abfd2108e96ea9373ce2aaec6f59`; copy SHA-256 `6a0c365b2497cfa0c373aff5b0da8cbbc3c0f795eb6834339edfe9d1580e04b4`. It is intentionally a different publication contract from the former D3.2 numerical snapshot, while preserving C2 research identity. D3.4 changes no article/copy/contract bytes and invents no new edition identity.

All **17 unique source links** were checked: eight direct HTTP 200 responses and nine exact-URL content retrievals through the web tool after local BLS 403s/FRED timeouts. [BLS CPI](https://www.bls.gov/cpi/), [BLS productivity](https://www.bls.gov/productivity/) and all seven FRED catalog pages resolved with matching page/series identities. [source-links.json](source-links.json) preserves the distinction between access methods. No updated economic source file was downloaded or used. Providers may revise current vintages; the acquisition instructions do not promise the older vintage is still supplied.

## 6. Verification and prior failures

Detailed metadata: [verification-results.json](verification-results.json), [scope-evidence.json](scope-evidence.json). Detailed logs, browser screenshots and AX snapshots remain local in the isolated worktree's ignored `.refresh/` directory.

| Check | Result |
|---|---|
| Locked installs, production build | PASS; Node 24.19.0. Existing large-chunk warning remains for unrelated shared bundles. |
| Complete `npm run verify` | PASS, 19 entrypoints; includes weekly digest, refresh/rollback, international fixtures, all existing research modules, China and AI Macro. No real notification or refresh executed. |
| AI Macro narrative default | 43 PASS / 1 optional internal-originals SKIP / 0 FAIL. |
| Authenticated internal AI Macro originals | 51 PASS / 0 SKIP / 0 FAIL; authenticates original values, directions, dates, hashes, permissions and missingness. |
| Public/build exclusion and scope | PASS; 3 public files, 40 build files; all original data/protected production files preserved. |
| Signal core | 256 PASS / 2 existing SKIP / 0 FAIL. TM-14 true-release-vintage replay unsupported; OP-03 methodology upgrade requires a separately approved version. Existing rejection safeguards pass. |
| Signal Pipeline + archive | 71 PASS / 0 FAIL. |
| Signal Public | 86 PASS / 0 FAIL. |
| AI Macro browser | PASS: 12 viewport/language/theme combinations, four channel links, two direct deep links, two authentication-failure modes, 28 other-route smoke checks; no page errors, economic runtime requests or overflow. |
| Existing-site browser | PASS: 12 home cases, 348 route cases, 18 existing behavior checks, no errors. Includes protected existing historical-data and CSV behaviors. |
| Integrated China publication browser | PASS: 12 display cases, EN/ZH navigation/keyboard and compiled-build discovery; both tested URLs were loopback, no live production acceptance/deployment claimed. |
| Keyboard / automated AX | PASS for existing named main/article/headings, source disclosure/provider focus and deep-link focus. EN/ZH screenshots inspected. |
| Official/catalog source links | PASS, 17 exact destinations; access-method caveats above. |
| GitHub exact-head CI | Required SUCCESS at the final report commit. The PR handoff receipt records the full SHA, immutable workflow run URL and observed conclusion after push. A missing/mismatched receipt means this gate remains NOT_VERIFIED. CI runs read-only Signal core on the PR; it does not substitute for the broader local checks. |

The prior D3.1 inherited failures remain resolved by independent commit `39867318c27caf3f1d4b4af37289056b57f40278`: Pipeline's hard-coded `1.1.0`/old bundle assumptions now compare explicit checked-out baseline identities; fixture vintage setup retains historical releases independently. Public fixtures no longer accept before the actual retained data vintage. Tests still reject genuine future source timestamps, acceptance regressions, changed version/lock/refresh and economic bundles. No production Signal logic was changed. PR #19's separate international-refresh fixture repair remains preserved; these checks pass. No test was disabled to achieve D3.4 acceptance.

## 7. Security, rights and accessibility limitations

Root `npm audit`: zero vulnerabilities; source-map-js 1.2.2 hardening retained. Isolated offline Signal package: one existing moderate Ajv `$data` ReDoS advisory [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6), zero high/critical. Current schema compiler does not enable `$data`; the production browser never imports the engine. This phase does not silently upgrade the frozen engine or claim the dependency finding is fixed. Track a separately tested maintenance repair.

No source permission changed. New publication selects no economic numerical facts and distributes authored interpretation/provenance/navigation only. Historical acquisition, storage and prior redistribution remain separate questions; the [FRED terms](https://fred.stlouisfed.org/legal/) and provider-specific requirements have not been legally cleared by this technical audit. Preserve the original rights evidence and obtain owner review as needed.

**MANUAL_SCREEN_READER_ACCEPTANCE = DEFERRED_BY_OWNER.** Formal VoiceOver/NVDA testing remains paused. Existing accessibility functionality and regression tests are preserved; no screen-reader-specific feature or formal acceptance was added. This is an owner-approved acceptance limitation, not a newly discovered implementation failure. No WCAG certification/conformance claim is made.

## 8. Required owner decisions and exact next steps

1. Select and authorize an independent private backup destination, perform checksum/readback/restore verification, and locate/authenticate the separately archived original electricity workbook. Alternatively record an explicit owner decision on these preservation gaps; public old branches are not a private durable backup.
2. Decide the residual historical-exposure and source-permission policy: accept bounded forward-only A after review, or request a separately approved, exact B/D cleanup plan. Nothing has been deleted or rewritten. C remains a future architecture option.
3. Review the unchanged D3.3 publication identity and findings, retained moderate offline dependency limitation, and continuing screen-reader deferral.
4. Confirm the PR receipt's exact-head SUCCESS and current-main comparison. If main advances again, normally merge the new changes and rerun affected checks before release.
5. Only after these decisions, provide explicit authorization for any production release operation. This preparation does **not** authorize marking ready, merging, deploying, refreshing economic data, sending mail or enabling automation.

No unauthorized production operation occurred. The authorized work ends with a sanitized feature-branch handoff, PR #18 still Draft and auto-merge disabled.

中文摘要：D3.4 已通过普通合并保留最新 main 的中国货币战略文章与共享路由，并保持 AI 宏观研究文章、原始研究、经济快照、Signal 与每周摘要逻辑。构建、完整验证、内部原始数据校验、中英文浏览器、路由、键盘与自动 AX 检查通过；最终 GitHub 精确提交 CI 以 PR #18 的不可变回执为准。新 AI 宏观构建不托管历史数值，SPF10 仍仅提供官方入口；旧公共分支、提交和存档仍可访问。所有者确认没有独立备份，旧数据来源许可与历史暴露仍需决定。建议有条件提交所有者审阅，生产暂为 NO-GO；正式屏幕阅读器验收维持 DEFERRED_BY_OWNER。未合并 main、部署、刷新数据、发通知、启用自动化或清理历史。
