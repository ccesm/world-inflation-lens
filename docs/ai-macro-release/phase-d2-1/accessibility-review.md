# D2.1 accessibility acceptance

**MANUAL ACCEPTANCE PENDING.** No actual VoiceOver or NVDA spoken test was completed. The available native in-app browser supports keyboard/AX inspection; the task does not establish access to a native browser plus an observable screen-reader speech session. No OS accessibility preference was silently changed. This is an outstanding release acceptance item, not an automated PASS.

Passed: actual macOS Space opens Inflation selector; Down/Down/Return selects SPF10; Tab focuses “View Official SPF10 Data”; Return on 中文 updates heading, explanation and “查看官方 SPF10 历史数据”. Chrome checks EN/ZH heading H1/H2/H3 order, main landmark, semantic selector, explanatory text, exact named safe external link, Tab/Shift+Tab visible outline, and Space history loading after returning to a numerical indicator. Fresh SPF selection requests no history and displays no table/chart/number. Existing numerical tables remain semantic and preserve missing values. Eight viewport/language/theme combinations show no horizontal overflow.

Required manual checklist before READY:

1. VoiceOver/Safari or VoiceOver/Chrome (or NVDA supported browser): navigate landmarks and headings; select SPF10 via native keyboard.
2. Confirm the explanation is read in order and identified as externally hosted, with no phantom chart/table, no duplicate/disruptive live announcements, and no stale numerical result.
3. Confirm the official link's EN/ZH name, new-tab behavior and return focus. The page language must track EN/ZH.
4. Switch back to CPI/PCE; confirm chart text alternatives/table captions and missing-value language; inspect pagination and failure/retry message.
5. Verify zoom and focus/contrast visually in light/dark, 390px/1280px. Record tester, OS/browser/AT versions, date and outcomes. Correct failures and rerun targeted tests.

Browser AX and native keyboard evidence are useful but do not establish full WCAG conformance or replace this checklist.
