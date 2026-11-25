# Follow-ups

## Flaky tests

### DateRangePicker form test times out under full-suite load

In one full `packages/ui` run, `test/DateRangePicker/form.test.ts` ("validates
when a range is completed", 5.4s) failed, then passed in isolation and in later
full runs. It is likely timing-sensitive; worth checking for fixed sleeps.
