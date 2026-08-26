# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## Site example type errors (pre-existing)

The site's torp-check reports ~90 pre-existing type errors (e.g. accordion and
combo-box examples not passing the now-required `value` prop to Accordion /
ListBox) but exits 0. Worth cleaning up separately.

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

## $run effects can't read suspended $async getters (view runtime)

Found while building DataGrid: a bare `$run(() => ... $state.someAsyncGetter ...)`
effect gets `undefined` from a suspended read instead of suspending or
throwing -- in one scratch case it crashed with `TypeError: Cannot read
properties of undefined` on first run; in another shape it silently produced
an unhandled promise rejection when the getter later rejected.
`@await` boundaries handle suspension correctly; plain effects don't.
DataGrid works around it by never reading async getters outside the template's
boundary (active-cell clamping moved into functions called at use sites).
Worth either documenting as a rule ("only read $async getters inside @await
boundaries") or making effects suspend like boundaries do.

## DataGrid: known gaps from the first version

Built with static `data` or a network `load` function (the shared loader shape
lives in `src/ui/utils/loader.ts`, ready to port to ComboBox etc.). Left out
deliberately:

- No PageUp/PageDown keyboard navigation (APG grid suggests it when rows
  paginate); arrows/Home/End/Ctrl+Home/Ctrl+End only.
- No selection model (row or cell), so no `aria-selected`; APG's
  "optional interactive" behaviors (editable cells, checkboxes) are unhandled.
- No virtualization -- every row of the current page renders. Fine for paged
  grids; a virtual-scroll variant will want windowed rendering plus
  `aria-rowcount`/-rowindex handling.
- Columns are read once at setup (adding a column later won't re-render
  headers). Rows are fully reactive; columns assumed static.
- Sorting a loader-backed grid refetches with `sortBy`/`sortDirection` in the
  request but there is no optimistic local sort or stale-request cancellation
  yet (the `AbortSignal` param exists on the Loader type, unused by DataGrid).
- `aria-rowcount` is set from the loader's `total` when provided; not wired to
  `aria-rowindex` on rows.

## Loader adoption in ComboBox/SelectBox: known gaps

ComboBox and SelectBox now accept the shared `load` prop (utils/loader.ts
`createItemLoader`) and auto-render a ListBox of loaded options when no
content is slotted in. Left out deliberately:

- No built-in debounce for ComboBox typing -- every keystroke starts a fetch.
  Consumers wrap their loader if they need it; a shared `debounceMs` option
  would be the nicer API (needs timer handling inside the reactive getter).
- Stale-response ordering relies on `$async`'s generation guard; no
  AbortSignal is passed to loaders yet, so cancelled fetches still run to
  completion over the wire.
- SelectBox loads once per mount (content stays mounted but hidden), not once
  per open; a refresh-on-reopen option may be wanted.
- Tree lazy child loading (per-node load functions) doesn't fit this shape
  and needs its own contract when implemented.

## $bind silently no-ops when the state key differs from the prop key (view runtime)

`$bind(state, props, key)` syncs same-named keys. Binding a differently-named
state property (e.g. `$state.values` against `props.value`) compiles and runs but
syncs nothing — no warning. Found while building TagInput (named the state key
`values`); worked around by naming the state key `value` like ListBox/Tree do.
`$bind` could validate that each key exists on both objects and throw in dev.

## View compiler/runtime quirks found while building the new UI components

- A second component function with its own `@render` in the same `.torp` file
  (after the default export) crashes the client build with `TypeError: Cannot
  read properties of undefined (reading 'markup')` in buildTemplate. Same-file
  plain helper functions are fine. Worked around in Stepper by moving the
  nested `Marker` component into its own file (src/ui/Stepper/StepperMarker.torp).
- `<@element self={expr}>` renders the dynamic tag but silently drops all
  other attributes on it (class, type, aria-label, onclick...). Docs say
  children/slots are preserved; attributes appear unsupported.
- Template-literal interpolation with arithmetic on `@for` loop variables
  miscompiles (details in the section below).

## Template-literal arithmetic miscompiles inside @for attribute values (view compiler)

Found while building the Carousel indicators (src/ui/Carousel/CarouselIndicators.torp):
`` `Go to slide ${slide.index + 1}` `` in an `aria-label` compiled to something like
`Go to t_item_1.data 1` -- member access plus arithmetic on a loop variable inside a
`${}` interpolation silently degrades. Works fine outside `@for` (CarouselSlide
interpolates `$state.index + 1` correctly), and plain member expressions in loop
bodies (`data-state={context.isActive(slide.index)}`) are fine. Worked around by
computing the label in a helper function. Worth a compiler test + fix.
