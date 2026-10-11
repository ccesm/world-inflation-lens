# D2 performance and asset assessment

Environment: local macOS arm64, Node 24.19.0, installed Chrome 154.0.8037.99, headless cold contexts and loopback Vite previews. No throttling or remote CDN/network test. These are measurements of this test run, not production guarantees.

Full local-only page: initial display **537–1022 ms**; on-demand history fetch/hash/parse/render **105–127 ms**. D1 historical comparison: 545–1,028 ms and 115–145 ms. Variation within local runs cannot establish a statistically meaningful improvement/regression.

Largest daily-series measurement: **122 ms** for click-to-visible chart; CDP task-duration delta **0.083658 seconds**, whole-page used JS heap **10,978,092 → 14,105,808 bytes**. This includes fetch/hash/parse and page work; it is not isolated chart CPU cost, peak memory, a garbage-collection study or proof of no leak. A four-megabyte frozen history intentionally remains cached per page load. Twenty-four table rows are rendered at once.

Full external summary 94,416 bytes; external history **4,500,722 bytes**, local gzip **318,565 bytes** (illustrative encoding, not a Pages response measurement). Private full route JS **128,482 bytes**, gzip **21,672 bytes**. Public hold route JS **34,534 bytes**, gzip **13,926 bytes**. Full history is absent from candidate public/dist directories. The stub contains hashes/status only. Do not quote the much smaller hold payload as full-data performance.

Macro route remains lazy. All 26 unrelated routes requested neither macro history nor its route chunk. Full overlay makes zero history requests initially and exactly one shared request when all four charts load. No runtime economic API. Native calendar frequencies, explicit null gaps and selected measures remain unchanged. Static asset paths resolve below `/world-inflation-lens/`.

The build's existing >500kB shared-chunk warning remains; no broad performance refactoring was attempted. Repeat cold/mobile/throttled measurements on the permitted full distributable artifact before D3. No asset compression or CDN behavior has been configured during D2.
