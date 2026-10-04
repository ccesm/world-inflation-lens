# Signal Engine shadow health in the existing daily email

This addition reuses `scripts/notify.mjs`, its existing Gmail transport and the two existing Gmail secrets. It sends no second message. No repository variable or secret is changed; automatic execution remains behind `SIGNAL_SHADOW_ENABLED == 'true'`.

The evaluator exports `signal-shadow-summary/1` only after interpretation validation and, for the private archive path, successful persistence. It contains status, ten-character snapshot/artifact identifiers, rule/engine versions, assessed-factor count, evidence-quality counts, sensitivity labels, controlled failure categories and reuse status. Full artifacts, lineage, diagnostics, paths and private archive details are excluded. Counts and sensitive-factor labels derive from actual validated factors; `factorsValid` counts available assessments, excluding INSUFFICIENT_DATA/UNASSESSED.

The summary file is temporary, outside the website. The final `if: always()` shadow step validates it, exports one JSON job output and renders `$GITHUB_STEP_SUMMARY`. The existing notify job consumes the same contract and renderer. It retains `always()` and its daily-event/main guards while awaiting build, deploy and shadow. Skipped or failed shadow execution does not suppress the existing email. Deployment still depends only on build. The Actions summary says deployment is unaffected because the independent deployment job's final result is not yet available there; the email uses the actual deployment result.

CURRENT and UNCHANGED describe the validated interpretation. UNCHANGED explicitly identifies reuse. FAILED_WITH_LAST_VALID labels factor information as last-valid and never current. NO_VALID_ARTIFACT has no factor claims. A disabled gate produces DISABLED. Missing, malformed, oversized or unsafe input produces UNKNOWN, with no exception details. Failed build eligibility also produces UNKNOWN with a controlled ECONOMIC_BUILD category. Private restore/publication failure cannot claim a newly persisted current interpretation.

The original economic email body and subject are preserved; the safe Signal section is appended. SMTP configuration, recipients, retry behavior, Message-ID generation and notification outcome handling remain on the original path. Development uses `--dry-run` without mail credentials.

Validation commands:

```sh
node --test scripts/tests/signal-summary.test.mjs
node scripts/verify-notification.mjs
npm run signal:test:pipeline
npm run build
npm run verify
```

Local preview fixtures cover CURRENT, UNCHANGED and FAILED_WITH_LAST_VALID. These demonstrate rendering, not new economic observations or live mail delivery. The safe-summary suite also covers NO_VALID_ARTIFACT, DISABLED, UNKNOWN, mixed quality, empty sensitivity, unsafe-field rejection, workflow dependency guards and CLI failure export.
