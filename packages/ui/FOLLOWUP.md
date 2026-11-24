# Follow-ups

## Flaky tests

### Slow tests time out under full-suite load

In one full `packages/ui` run, `test/Menu/basic.test.ts` ("Basic
operation"), `test/Menu/nested.test.ts` ("closes parent when closing nested
submenu") and `test/DateRangePicker/form.test.ts` ("validates when a range
is completed", 5.4s) failed, then passed in isolation and in two later full
runs. They are likely timing-sensitive; worth checking for fixed sleeps.
