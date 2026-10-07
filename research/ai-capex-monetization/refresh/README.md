# Quarterly refresh qualification — research only

See [operational contract](../../../docs/AI_CAPEX_QUARTERLY_REFRESH.md) and [compact qualification report](reports/quarterly-refresh-qualification.json).

From repository root:

```sh
node --test research/ai-capex-monetization/refresh/tests/*.test.mjs
export WIL_AI_CAPEX_PYTHON=/tmp/wil-phase2d-python/bin/python
$WIL_AI_CAPEX_PYTHON -m unittest discover -s research/ai-capex-monetization/refresh/tests -p '*_test.py'
node research/ai-capex-monetization/refresh/scripts/qualification.mjs
# Network, explicit current cutoff; no acceptance/publication:
node research/ai-capex-monetization/refresh/scripts/run.mjs --as-of YYYY-MM-DD
```

Use the pinned existing `quarterly/requirements.txt` Python environment for native HTML/PDF extraction. `WIL_AI_CAPEX_CACHE` defaults to `~/Public/wil-ai-capex-cache`, outside Git. `--check-known` checks recent accepted URLs for changed raw bytes; normal runs reuse only validated known objects. A 403/429 blocks that host for the run. There is no proxy, retry loop or secret.

Outputs, runtime receipts, controlled synthetic qualification examples and public previews remain ignored in `outputs/`. The committed report separates live ACCESS_BLOCKED/REVIEW_REQUIRED results from synthetic qualified-quarter controls. Read `latest-receipt.json` for current operational status; never treat the last-valid candidate pointer as accepted production data. No-new-data runs preserve the economic identity. `--review-file` validates a research-only human gate and performs no promotion write.

No scheduler, Action, email, runtime LLM, production source import or public data write exists. Frozen accepted Phase 1–2B evidence remains unchanged. This branch must not merge into production main.
