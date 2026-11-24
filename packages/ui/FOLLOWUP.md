# Follow-ups

## Flaky tests

### Popover hover tests depend on real-time waits

`test/Popover/hover.test.ts` fails intermittently: most runs, one of the
touch tests fails, and it isn't always the same one (seen: "a touch tap on
an embedded control runs the action without opening" and "touchBehavior
ignore never opens from a tap, even on the inert surface", where the popover
content is still in the document). The tests use fixed `wait(40)`-style
sleeps against the hover intent and grace timers, so the outcome depends on
scheduling. It fails just as often before and after the delegated-event
bubbling fix (`aa042319`), so that fix didn't cause it. Use fake timers
(`vi.useFakeTimers()` + `vi.advanceTimersByTime`) instead of sleeping.

### Slow tests time out under full-suite load

In one full `packages/ui` run, `test/Menu/basic.test.ts` ("Basic
operation"), `test/Menu/nested.test.ts` ("closes parent when closing nested
submenu") and `test/DateRangePicker/form.test.ts` ("validates when a range
is completed", 5.4s) failed, then passed in isolation and in two later full
runs. They are likely timing-sensitive in the same way; worth checking for
fixed sleeps when the Popover tests are fixed.
