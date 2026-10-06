# Controlled fixtures

`releases.ics` is a synthetic official-calendar-shaped fixture, not proof of an actual release. Tests hand-assign threshold paths and fixed-width CPS fields; synthetic ZIPs exist only in temporary stores. Aggregate mock responses are constructed from the pinned official Phase 1 observations and change a declared operand by 100; tests independently assert the resulting change and retained early history. No synthetic source is accepted into the checked-in current monitor.

Actual historical reconstruction uses accepted Phase 3 current-vintage group paths separately. It is not a publisher-vintage backtest. All tests are offline, with source functions injected; no scheduler or email is invoked.
