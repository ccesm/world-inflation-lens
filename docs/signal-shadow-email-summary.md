# Signal Engine shadow health in the existing daily email

This addition reuses `scripts/notify.mjs`, its existing Gmail transport and the two existing Gmail secrets. It sends no second message. No repository variable or secret is changed; automatic execution remains behind `SIGNAL_SHADOW_ENABLED == 'true'`.

The evaluator exports `signal-shadow-summary/2` only after interpretation validation and, for the private archive path, successful persistence. It contains generated bilingual conclusions, allowlisted factor state/quality/sensitivity records, status, ten-character snapshot/artifact identifiers, rule/engine versions, assessed-factor count, evidence-quality counts, sensitivity labels, controlled failure categories and reuse status. Full artifacts, lineage, diagnostics, paths and private archive details are excluded. Counts and sensitive-factor labels derive from actual validated factors; `factorsValid` counts available assessments, excluding INSUFFICIENT_DATA/UNASSESSED.

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

## Automatic local-only shadow storage

The automatic `signal-shadow` job now evaluates into a fresh `$RUNNER_TEMP/signal-shadow-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT` directory. It does not pass `--private-archive`, reference `SIGNAL_ARCHIVE_REPOSITORY` or require `SIGNAL_ARCHIVE_TOKEN`. Optional private-archive code and tests remain available for future explicit use. The activation gate is unchanged; this change does not enable it or change repository settings.

Economic acceptance, semantic/provenance validation, snapshot binding and the frozen R1–R6 engine safeguards remain on the same evaluator path. Only the allowlisted safe summary is exported to Actions/email. After that handoff an `always()` cleanup removes the temporary restricted store; nothing is uploaded from it or copied to `public/` or `dist/`.

A fresh automatic job has no cross-run last-valid interpretation. Success normally reports CURRENT. UNCHANGED requires a genuinely validated prior interpretation in the same local store; a new runner does not have one. Evaluation failure in a fresh store reports NO_VALID_ARTIFACT, no factor counts or last-valid identity, and: “No validated Signal Engine interpretation is available for this run. Economic deployment remains unaffected.” The optional explicitly persistent archive path retains its validated fallback semantics. Missing or unreadable summaries continue to report UNKNOWN rather than inventing an assessment.

Deployment still depends only on the successful economic build. The existing daily notification still awaits the isolated shadow result under `always()`, sends only one email and uses the actual deployment outcome. No secrets, public UI, data snapshots, methodology, thresholds or version are changed.

The manually dispatched qualification also allows `codex/signal-shadow-no-private-archive`. It executes the actual local-only CLI with no archive credentials, independently validates the stored interpretation, checks a fresh-store failure has no fallback, runs safeguards/build/verify and checks disclosure. Only the bounded qualification report is uploaded; restricted interpretations remain runner-local. Frozen pipeline regression inputs are reconstructed in an isolated fixture so routine production snapshot refreshes do not invalidate the test baseline.

The deterministic conclusion extension and 24 KiB UTF-8 handoff bound are documented in [signal-conclusions.md](signal-conclusions.md). Only CURRENT/UNCHANGED include current research conclusions; failure, unknown and disabled states explicitly withhold them. The frozen factor methodology is unchanged.
