# AI CapEx → Monetization foundation

Research only. Four separate native company accounting conventions; no identified AI ROI, forecast, investment ranking or production integration.

Start with:

- [Model matrix](../../docs/AI_CAPEX_MONETIZATION_MODEL_MATRIX.md)
- [Accounting bridge](../../docs/AI_CAPEX_ACCOUNTING_BRIDGE.md)
- [Data contract and qualification gaps](../../docs/AI_CAPEX_MONETIZATION_DATA_DESIGN.md)

`fixtures/official-anchors.json` contains sparse manually reviewed official disclosures, not a continuous quarterly dataset. It includes explicitly unavailable observations. Raw source bytes are not archived by this fixture; raw hashes remain null. Complete raw-source/vintage ingestion is a future qualification task. All four companies have a June 2026 financial anchor; Microsoft AI run-rate is March 2026, not June. Historical 2019 anchors include later comparative vintages and Alphabet H1 cash durations.

```sh
node --test research/ai-capex-monetization/tests/*.test.mjs
node research/ai-capex-monetization/scripts/normalize.mjs > /tmp/wil-ai-capex-anchors.json
```

Run from the repository root, Node >=22.12. No network or extra dependencies are required by these commands. Normalization emits stdout, writes no files and never changes snapshots. The JSON Schema is a draft structural contract; `contract.mjs` implements additional semantic/period/accounting validation. This is not a live source adapter or a proof of source authenticity.

Never add generated normalization output, downloaded HTML/PDF or large historical archives to normal Git history. Small reviewed fixtures and tests belong in Git. Future raw retention must preserve byte identities, retrieval receipts and recovery independently. Never treat run-rate or backlog as recognized revenue; lease additions are distinct from principal; operating lease cash may already be in CFO.

## Phase 2A official quarterly panel

The additive [quarterly research namespace](quarterly/README.md) qualifies native quarterly history and raw identities outside Git. See [qualification report](../../docs/AI_CAPEX_QUARTERLY_PANEL.md). The Phase 1 sparse fixture and conclusions remain unchanged; four-company monitor readiness is still blocked by the documented source/accounting gaps.
