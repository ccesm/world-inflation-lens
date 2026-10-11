# D2 browser QA

Two datasets were tested separately. The pushable candidate has no economic records and shows a bilingual release hold. The local-only full-data overlay uses current D2 UI code plus exact external D1 fixtures; it is not a publishable preview or the candidate's data bundle.

Installed Chrome 154.0.8037.99 on macOS arm64, headless real-browser contexts, 390/1280 × EN/ZH × light/dark. Fresh context per combination. Numerical dates, source attribution, all twelve selectors, four charts, native measures, one shared history fetch, CPI missing row and zero overflow passed in the **local-only full overlay**. Direct route, reload, navigation, language/theme, hold message, no numerical cards and no history requests passed in all eight **pushable hold** combinations.

| Width | Language | Theme | Full local result | Initial ms | History ms |
| --- | --- | --- | --- | ---: | ---: |
| 390 | en | light | PASS | 615 | 127 |
| 390 | en | dark | PASS | 1022 | 121 |
| 390 | zh | light | PASS | 622 | 113 |
| 390 | zh | dark | PASS | 979 | 111 |
| 1280 | en | light | PASS | 991 | 116 |
| 1280 | en | dark | PASS | 995 | 105 |
| 1280 | zh | light | PASS | 550 | 122 |
| 1280 | zh | dark | PASS | 537 | 121 |

The additional release suite visited all 26 previously registered routes; each rendered one main heading without NaN/Infinity/undefined. No macro bundle or history was requested on unrelated routes. Seven inherited representative routes were also covered by the full overlay suite. This is route/render regression coverage, not a claim of exhaustive acceptance of every control on every legacy page.

Blocked-history and changed-byte injection preserved summary cards, suppressed charts and offered manual retry without automatic retries. No page errors or live economic source requests were observed. The public-hold run recorded only the existing Google Fonts stylesheet/font requests (fonts.googleapis.com and fonts.gstatic.com); these are inherited from production styles, not newly added economic requests or scripts. The unchanged site status request, where used by legacy pages, is also separate from economic data.

Native macOS in-app browser interaction separately verified popup Space/Down/Return, Tab/Shift+Tab, Escape, history Space, pagination Enter and language Return. Chrome CDP AX inspection supplements this; actual screen-reader acceptance remains pending. Screenshots were captured for all eight full overlays and eight hold combinations outside Git; compact reproducible summaries are committed in `browser-qa-summary.json`. Native AX showed correctly updated labels and table cells in Chinese. Selected screenshots were visually inspected for mobile chart/readable HTML labels and desktop typography. No claim of an eight-combination human screen-reader audit is made.

Reproduce full tests by making a **private, non-Git overlay** of current code, replacing only its hold stub with the pinned external summary, and putting the external history at its pinned namespace. Build/serve that overlay on loopback, then run `scripts/verify-ai-macro-browser.mjs` there. Run `browser-release.mjs` from the candidate with explicit `WIL_D2_CANDIDATE_URL` and `WIL_D2_FULL_URL`, both loopback URLs, plus `WIL_PLAYWRIGHT_MODULE`, `WIL_CHROME_EXECUTABLE`, `WIL_BROWSER_OUTPUT_DIR`. Do not restore full assets into the candidate before rights clearance. Test-only rendering does not grant redistribution permission.
