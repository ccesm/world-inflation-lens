# Frozen AI-labor archive/hydration qualification

Research-only tooling for stack `09fcc21aad29c36697f4775048ad87694a1a8b61`.
This branch does not deliver or remove any of the stack. Production remains
1.1.0. Original Phase 1–3 and monitor branches remain recovery evidence.

The reviewed `stack.lock.json` is the trust anchor. It contains a complete
507-file SHA-256/size/path/Git-blob map, original inventory identity, A/B/C/D
classification and phase dependency closure. Archive inputs come exclusively
from frozen Git objects, never from local caches or new downloads. All original
raw/canonical hash markers, manifests, genuine retrieval/acceptance receipts,
licenses, frozen rules, revisions and benchmark outputs survive byte-for-byte.
This proves preservation of the recorded receipts, not an independent audit
of historical capture clocks or source availability.

The USTAR archive contains one embedded manifest and one regular file per
unique SHA-256 object. Original path aliases remain in the index. UID/GID,
mtime and names are fixed; paths and objects are sorted. Byte-identical
packaging is independent of local filesystem timestamps. Tar mtime zero is
packaging metadata, not a research acceptance timestamp. No file content is
rewritten. A/B code/specifications/indexes and B fixtures remain normal-Git
candidates in the preserved stack; no slim delivery is prepared here. Including
all A/B in the recovery archive makes standalone frozen-code recovery possible.

## Offline commands

Use Python 3.10+ (qualified with 3.13.1). Run from this feature checkout.
`ARCHIVE` below denotes an existing downloaded/local archive; paths must be
outside `public/` and `dist/`. Use a real absolute directory, without symlink
parents (on macOS use `/private/tmp`, not `/tmp`). Targets must not exist.

```sh
# Packaging requires the original Git objects, not the large files in checkout.
python3 scripts/ai-labor-archive/archive.py pack \
  --repo /path/to/original/repo \
  --archive /private/tmp/frozen-ai-labor.tar \
  --index /private/tmp/repacked.lock.json

# Compare repacked index/archive with reviewed pins before use.
python3 scripts/ai-labor-archive/archive.py verify \
  --archive "$ARCHIVE" --index docs/ai-labor-archive/stack.lock.json
python3 scripts/ai-labor-archive/archive.py hydrate \
  --archive "$ARCHIVE" --index docs/ai-labor-archive/stack.lock.json \
  --target /private/tmp/recovered-research --phase monitor

# Two clean recoveries, raw-source/semantic validation, offline rebuilding,
# accepted hash comparison, recorded replay and local monitor-store recovery.
python3 scripts/ai-labor-archive/qualify.py \
  --archive "$ARCHIVE" --index docs/ai-labor-archive/stack.lock.json \
  --work /private/tmp/qualification-new --regressions
python3 -m unittest discover -s scripts/ai-labor-archive -v
```

`--phase phase1|phase2|phase3|monitor` selects cumulative dependencies.
The bounded single bundle is globally deduplicated; selection limits hydrated
paths, not download size. All bundle objects are verified even for a partial
hydration. A future split transport must preserve this same complete lock.

Hydration validates the outer SHA-256/size, embedded manifest pin, unique
regular object members, each size/hash and each alias before creating output.
It rejects absent objects, unknown members, links, traversal/noncanonical paths,
invalid closures and existing roots. Files are staged before output creation.
No tar extraction API, live API fallback or execution of archived code occurs
in hydration. The explicit qualification command executes frozen research code
in new temporary roots, blocking Python socket connections. It writes only
local qualification stores/outputs and removes ambient CI summary side effects.
Use the Git-reviewed lock; a lock supplied by an untrusted archive is not
self-authenticating. SHA-256 identity does not provide a publisher signature.

## Preservation boundary

All 416 proposed C/D paths are retained in archive and original stack, along
with all 91 A/B files. No untracking, history rewriting, branch deletion,
methodology adjustment, quintile change, production integration or activation
is authorized by this result. No acceptance receipt is regenerated/backdated.
Phase 1 rebuild explicitly replays its recorded `pipelineRunAt` runtime metadata because
Phase 3 pins the full macro-context summary bytes. This is byte reproduction,
not a new historical acceptance or source capture. New dry-run evaluation clocks are current; their deterministic economic result
must equal the historical accepted result. Recorded-store replay preserves the
original dates. All missing observations and historical limitations survive.

The 139 individual-record CPS ZIPs were never in the 507-file Git stack.
Their exact hashes/URLs, actual receipts, qualified layouts, immutable monthly
sufficient statistics and all accepted analytical benchmarks are preserved.
Offline reproduction starts from those accepted sufficient statistics. This
archive cannot independently recover original person records if an external
raw cache is lost; no newly downloaded current vintage substitutes for them.
Raw-ZIP reparsing is a separate optional qualification, not claimed here.

See [rights review](redistribution.md), [qualification evidence](qualification.json)
and [storage status](storage.md). Local recovery alone does not authorize
removal, merging, monitor history writes, scheduling or email.
