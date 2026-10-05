# Pinned official-source archive

`raw/<sha256>.gz` stores gzip-compressed **original** BLS API JSON or Census XLSX bytes. Filenames hash the uncompressed bytes. Gzip timestamps are zeroed, so identical bytes produce identical stored files. These are public federal aggregate statistics, not confidential records.

`manifests/<sha256>.json` stores the exact official endpoint, POST request body when applicable, raw hash, provider and real capture timestamp. Manifest filenames hash canonical JSON bytes. No API key, credential or email is included. `candidates/` points to captured input, which is not accepted until semantic validation succeeds.

BLS histories are registration-free ten-year batches from 2015 onward. BTOS uses the two official downloads, retaining both original and expanded AI-question wording. Data files can be revised upstream; retained bytes and immutable normalized vintages permit future comparison without pretending to reconstruct earlier publisher vintages.

The checked-in first intake was captured October 5, 2026. See [qualification](../qualification.md) for coverage and hashes. Cite BLS/Census and the URLs recorded in each normalized source. Original workbook publication dates that are absent remain unknown.
