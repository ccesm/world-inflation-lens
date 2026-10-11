# D2 accessibility review

## Result

Keyboard and semantic checks passed within the tested environments. Actual screen-reader review is **MANUAL ACCEPTANCE PENDING**. This is not a WCAG 2.2 AA conformance claim.

## Actual interactive review

Using the Codex in-app browser's native macOS accessibility controls on the local-only full-data overlay:

1. Space opened the native Indicator popup.
2. Down + Return selected commercial realized electricity price; the heading, dated value and native unit updated.
3. Tab moved to the qualified-state selector; Shift+Tab returned to Indicator.
4. Space + Escape closed the popup without changing the selection.
5. Space on Show history loaded a chart and its semantic table.
6. Return on Older records advanced from the newest page to records 25–48; the button retained focus.
7. Return on 中文 changed title, labels, units, methodology and chart text equivalents to Chinese; focus remained on the language button.

The native AX tree exposed headings, navigation/main landmarks, named popups, source links, chart descriptions and table cells. This is actual browser interaction and AX inspection, **not** a VoiceOver speech session. Native Chrome computer-control access was not approved; the in-app browser provided the keyboard fallback. No compatible active screen-reader session was used, and no screen-reader pass is claimed.

## Automated supplement

Installed Chrome checked eight full-data combinations and eight public-hold combinations. Additional checks in both languages exercised Tab/Shift+Tab, Space history loading, Enter pagination, computed focus outline, named selectors, main/table/combobox AX nodes, page language (`en`, `zh-CN`), chart description and visible text equivalents. The historical numeric table includes native-period values and unavailable markers without relying on color. CPI's missing October 2025 row was verified separately in all eight full-data combinations.

## Minimal improvements

D2 adds explicit focus outlines for page buttons/links; atomic polite live text for the selected observation; a history-ready status; and a bilingual HTML chart equivalent naming the measure, native unit, displayed period, final displayed record and missingness/vintage limits. A readable 13px axis-range caption replaces tiny scaled SVG labels on narrow screens. These are presentation operations, not new economic calculations. Original selected values and C2 arithmetic are unchanged.

## Remaining manual gate A11Y-01

Before release, use VoiceOver/Safari or NVDA/Chrome for both languages. Check heading/landmark traversal, source attribution, missing-value announcement, controls, update announcement order, table pagination, chart-to-table navigation and return to global navigation. Review focus visibility and contrast in both themes, zoom and touch target behavior. No claim is made about spoken pronunciation, live-region verbosity, rotor behavior, complete assistive-technology compatibility or full WCAG coverage until this is done.
