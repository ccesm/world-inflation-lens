# D2.1 security remediation

User explicitly authorized the smallest compatible source-map-js patch. [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), independently rechecked 10 October 2026, affects versions before 1.2.2. The indexed-map input vulnerability is not dismissed because the package is a development dependency.

`npm update source-map-js --package-lock-only --ignore-scripts --no-audit --no-fund` changes only the source-map-js lock entry's version, tarball and integrity. Root dependencies, Vite 7.3.6 and PostCSS 8.5.28 remain unchanged. The parent declares `^1.2.1`; 1.2.2 satisfies that range. An automated deep comparison of old/new locks excluding this entry verifies no unrelated dependency drift.

A new, independent node_modules tree was installed with `npm ci --ignore-scripts --no-audit --no-fund`. No lifecycle script is required by this application's installed dependency set; successful build verifies the runtime toolchain. `npm ls source-map-js` resolves exclusively to 1.2.2 via Vite/PostCSS. `npm audit --json` reports zero total / high / critical vulnerabilities at review time. This is a dated audit result, not a permanent guarantee. No exploit stress test was performed.

Build and complete verification pass on the patched clean install. Numerical history remains same-origin, size/MIME/hash/schema checked, manually loaded, bounded and credentials-free. No arbitrary HTML rendering, new script, API, credential, LLM, mail, schedule, deployment change or authentication subsystem. SPF10 external navigation does not fetch or embed its workbook. The site has existing Google Fonts requests; no newly introduced economic API request appears in browser tests.

Remaining release gate: actual spoken screen-reader acceptance. SPF numerical redistribution rights remain UNRESOLVED and protected by the external-only boundary, not waived by this patch or by owner presentation approval.
