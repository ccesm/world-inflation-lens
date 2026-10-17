# D3.3 public exposure audit — completed before data minimization

Assessment date: 2026-10-17, America/Los_Angeles. D3.2 public PR head: `4b0e48c418930ba0bf575a2629879bf1ea67a6cf`. Latest production main: `3dbf9353ada22cd33ac64ed158f3fd29e9ec3b66` (includes PR #21 weekly email table and later international refresh). No dataset was modified or deleted during this assessment. Existing user work, D3.2 and other worktrees were preserved.

| Surface | Observed exposure before redesign |
|---|---|
| `public/data/ai-macro/<hash>/history.json` | Unauthenticated static access if deployed: 4,422,270 bytes, 35 series, 12,722 rows, 273 missing levels; full observations plus derived changes and locators. SHA-256 `6bfbc2c89362cc39d3ddc7bd50044866d3251059998bcea76196878aa1dcfeb3`. Lazy loading is not access control. |
| `src/data/ai-macro/summary.json` | 93,328 bytes, 35 numerical summaries including last-record/last-nonmissing values, changes, periods, locators and source metadata. SHA-256 `09247e08d0a45ee96c74cf6ce0646d21bc2ef3e32ff78feb271ff1db07a27688`. Imported into JavaScript. |
| D3.2 local build | Copies the full static history to `dist/data/ai-macro/…`; numerical summary and explorer code in a 130,802-byte lazy AiMacro JS chunk. Hiding controls or delaying fetch does not remove either exposure. Vite source maps are not enabled. |
| Public repository / PR #18 | Repository visibility is public. D3 numerical blobs are reachable by branch, commit, raw-content endpoints, Git clone and archives. PR draft status does not make files private. Deleting from a new commit leaves past commits/PR refs accessible. |
| Earlier public feature branches | D1, D2, D2.1 and D3 branches contain earlier summary/history versions. C2 (`362929ad…`) and D0 branches expose the full C2 analysis JSON and observations CSV: 36 series / 12,949 records, including SPF10 numerical history. D1/D2 also carried the earlier full numerical public projection. No numerical SPF values are repeated in this report. |
| Other research/source artifacts | Original C2 research tree has 198 files / 20,371,919 uncompressed bytes, including parsers, compressed fixtures, normalized extracts and analysis outputs. Earlier C0/C1M branches retain additional research evidence. Full source electricity workbook was already in an external archive, not Git; this audit does not claim to have copied it. |
| GitHub Actions artifacts | All 36 currently listed artifact metadata records inspected. No artifact is associated with the original D3 or final D3.2 head. Listed Pages artifacts belong to production main; archives were not downloaded or inspected, so byte-level absence is not claimed. PR workflow only runs read-only Signal tests. |
| Releases and existing production | Release asset metadata inspected; assets concern other research/video/archive work, not D3 Macro Monitor. No such asset was downloaded or changed. The exact D3 static-history URL on published Pages returned HTTP 404. This is bounded evidence, not proof about every URL, cache or historical deployment. D3 has not been merged. |
| Existing unrelated modules | Production `data/` and existing inflation/productivity/research bundles contain overlapping economic series for their own functions. They are out of D3.3 scope and must remain unchanged. The new build cannot truthfully be described as having no economic histories anywhere. |

## Preserved original research

Before removing current-publication files, an owner-readable local directory outside the candidate worktree was created under the primary repository's ignored `.refresh/` tree (directory mode 0700, files 0600). It holds authenticated full C2 analysis and identity, D3.2 numerical summary/history, the entire original C2 research tree archive, and the original D3.2 publication/code/evidence archive. Every archived C2 file was compared with its committed original bytes. Full C2, D3 history and summary hashes match the identities above and original C2 hash `ac85a5fe4455112f95f83ae2a650a637578480cf8ec1feba8cd52db15b642ec7`.

Original Git objects, public branches, D3.2 worktree and handoff documents remain intact. The private copy preserves analysis; it does not revoke prior public access. Local permissions and Git exclusion are not encryption, private-repository migration or an off-device backup.

## Safe remediation options for owner review

1. **Prospective minimization (implemented in D3.3):** remove macro history/summary/explorer from the new tree and build; publish narrative evidence/provenance only. Keeps a reviewable ordinary commit and all original research. Does not erase earlier exposure.
2. **Forward-only branch cleanup:** after approval and private preservation, remove unnecessary current public branch copies and any confirmed macro build/release artifacts. This needs explicit owner approval and still cannot guarantee removal of old commits, PR refs, clones or caches.
3. **Publish from a separate sanitized repository:** keep full research in owner-controlled private storage/repository; serve only a clean narrative tree. Requires owner choices about repository visibility, migration, hosting and access. Existing public repository exposure remains until separately addressed.
4. **Coordinated historical cleanup:** only with explicit approval, inventory all refs/PRs/tags/forks/artifacts, protect immutable evidence privately, coordinate any provider/GitHub assistance and decide whether history rewriting is appropriate. Force-push/history rewriting/branch deletion are NOT authorized or performed here; copied material may remain elsewhere regardless.

A new commit cannot make an already public dataset private. No Git ref, release, artifact, protected evidence or unrelated module was deleted. The owner must choose the residual-exposure policy before a production GO can cover more than the new build.

中文：审计先于数据最小化。原 D3.2 静态历史与摘要会公开数值；旧分支、PR 引用及 Git 历史还包含完整 C2 和 SPF10 数值。新提交只能消除新版本的托管，不能撤销旧提交、克隆或缓存。完整原始研究已在本地受限权限且排除 Git 的目录内按哈希保存；未重写历史、强推、删除分支/证据或修改其他模块。历史暴露的后续处理需所有者另行批准。
