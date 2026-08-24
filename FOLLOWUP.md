# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.

## Preview of built page sites fails at runtime (pre-existing)

`tb --preview` on page-based examples (`examples/demo`, `examples/mini`) returns
`{"code":"ERR_MODULE_NOT_FOUND"}` / `{"code":"ERR_UNKNOWN_FILE_EXTENSION"}` from
`dist/server/serverEntry.js` — its runtime imports (e.g. `.torp` route files)
aren't resolvable by plain Node. Reproduces at HEAD without the endpoints-only
site.html fix. Dev mode (`tb --dev`, which uses `vite.ssrLoadModule`) works fine.

## Calendar: day cells lack row/gridcell structure (component review)

Found during the Calendar APG review. The calendar grid has `role="grid"`,
an `aria-colcount`, and a proper header (`role="row"` > `columnheader`), but
the days are rendered as a flat list of buttons/spans directly inside the
grid -- no `role="row"` wrappers per week and no `role="gridcell"` per day,
so screen readers can't navigate it as a grid. The selected-day state is also
expressed as `aria-selected` on the `<button>`, which is only valid on a
gridcell/option/row/tab.

Fixing this properly is an API change: `buildDays` would need to group days
by week, and `CalendarGrid`'s slot contract changes from `$slot.days` to
weeks that users wrap in rows (or the grid renders days internally). Deferred
because it alters user-facing composition; everything else in the review was
fixed inline (single grid element instead of nested grids, reactive
`selectable` context getter so `aria-readonly`/`tabindex` update).
