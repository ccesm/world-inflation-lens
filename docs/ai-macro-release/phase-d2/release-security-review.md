# D2 security review — 10 October 2026

The release is not cleared. No dependency or lockfile was changed.

## Existing high advisory

The production lockfile and installed module both contain `source-map-js@1.2.1`, via Vite → PostCSS `8.5.28` → `source-map-js ^1.2.1`. The lock marks it `dev: true`. The local modules are symlinks to the existing installed workspace packages; the lockfile, rather than `npm ls`'s extraneous flag under that layout, establishes dependency ownership.

`npm audit --json` returned exit 1 with one high, zero critical advisories. The reviewed [GitHub advisory GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) identifies indexed source-map offsets that can cause synchronous denial of service, affected versions `>=1.0.0 <1.2.2`, and patched version `1.2.2`. It was published 18 September and updated 5 October 2026. The audit response reports CVSS v3 7.5; the advisory page reports v4 8.7. These are different scoring versions, not two vulnerabilities.

The vulnerable indexed consumer exists in the installed package. Exploitation requires processing an attacker-controlled indexed map with malicious section offsets. The application has no source-map ingestion endpoint, Node application service, or browser import of this consumer. Vite/PostCSS use it in the development/build toolchain. Builds use reviewed repository CSS and dependencies; an untrusted imported source map would be the relevant input boundary. The built site contains no `.map` files and no indexed consumer implementation. This inspection found no demonstrated remote browser exploitation route. It does **not** establish that all toolchain input paths are safe, and dev-only classification is not grounds to dismiss the advisory.

**Release gate SEC-01 remains open.** Perform a separate minimal lockfile update to patched `1.2.2` (within PostCSS's compatible `^1.2.1` range), with clean installation, build/full verification and a new audit, before full release. No upgrade, exploit stress test, or destructive proof of concept was performed here. Compatibility is based on the declared semver range, not a claim that the unperformed upgrade passed tests.

## D2-specific surfaces

- No new dependency, runtime economic API, credential, OAuth/PAT, LLM, database or third-party script.
- React text rendering; no `dangerouslySetInnerHTML`, dynamic HTML from data, or executable research output.
- Source navigation uses explicit official HTTPS host checks; external links use `noopener noreferrer`.
- History is one immutable same-origin namespace, checked for size, MIME, SHA-256 and schema, with bounded timeout and manual retry. No cookies or redirects. In the pushable hold candidate it is not fetched or included.
- The projection CLI applies the D2 public-rights gate before reading economic input or writing assets. A changed boolean, empty review, duplicate source, unsupported download or unresolved record cannot clear that gate.
- Full research data and raw financial documents are outside the candidate tree. The existing Google Fonts CSS/font requests are unchanged; no new external script was added. Built assets are checked for the eleven source hashes that would identify imported payloads; none are included. Public documentation contains counts, provenance, rights and hashes, not withheld SPF history or its latest numerical value.
- Existing Pages/notification workflows are unchanged. `deploy.yml` push trigger is restricted to main; its build/production jobs additionally require main. Other workflows are manual-only. Pushing this development branch does not schedule deployment or email. No workflow was dispatched.

Passing these checks does not waive either SEC-01 or the SPF redistribution gate.
