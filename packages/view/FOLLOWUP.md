# Follow-ups

Findings from a review of `packages/view`.

## Compiler

There are 89 `TODO` / `HACK` / `FIXME` markers under `src/`, and 23
commented-out `console.log`s (plus a commented-out debug `printPath` block
at the end of `compile/build/client/buildFragment.ts`), covering the following:

- **Component props**: default values and proper parameter→prop mapping are
  missing; prop source maps are approximate; `Bindable<T>` could be surfaced
  in the `$props` interface so two-way bindings type-check.
- **Component detection**: any capitalized tag is treated as a component
  (`parseElement`), without checking imports or namespaces.
- **Slot props**: defaults and slot-prop source maps are missing; a fill with
  only whitespace still takes the slot path.
- **Control parsing**: error recovery stops at the current position instead of
  the enclosing boundary; branch grouping scans past elements and needs more
  checks; `@with`/`@try` duplicate handling is heuristic.
- **Interpolation/source maps**: text span extraction, title brace counting,
  and the server text/attribute scanners still duplicate interpolation logic;
  moving text/attribute interpolation into parse would unify them.
- **Fragments**: merged text nodes are handled for the client but not the
  server; fragment text assumes children are rendering nodes (fill nodes
  should be skipped); the last-child parent path isn't shortened.
- **Type checking**: `@html`/`@replace` codegen and dynamic element types are
  largely untyped; element type mapping only covers a few tags.
- **Codegen passes**: script/import scanning is a separate pass over all
  chunks; component parameters only support `$props` (not user `$context`).
- **Server attributes**: transition attributes don't emit first-keyframe
  attributes; boolean attributes (`disabled`, ...) aren't detected; the
  partial-reactive attribute path still replaces braces without scanning code.
- **Bindings**: `&group` is only exercised with radios; input parsing for
  exotic values (NaN, etc.) is still basic.
- **Transitions**: only one entry/exit transition is supported; unknown
  transition attributes don't error; an await/cancel option on region removal
  is missing.
- **Builder**: `prepend` doesn't adjust the line map; `;` is used as an
  "ignore line" marker.
- **Reactive attributes**: no error when a reactive-looking attribute is used
  non-reactively.

## Runtime

- **Effects**: `$run` has no operator pipeline (debounce etc.); `clearSources`
  has an unresolved `else` branch.
- **Dynamic elements**: `setDynamicElement` swaps the tag without re-running
  `onmount`; consider treating it like `@toggle`.
- **Animation**: timing/reduce-motion should be configurable; the timeline/DOM
  workarounds need revisiting.
- **Hydration**: `getFragment` still builds a template while hydrating;
  `nodeCheckHydrationBreak` is a workaround worth removing.
- **Dev tools**: boundary label/depth tracking is fragile; `devContext`'s
  symbol/data names are provisional; `buildMount` doesn't emit dev boundaries
  like `buildRun`.
- **`useCreateElement`**: its local reactive-attribute check duplicates the
  compiler's heuristics.
- **Naming**: `ProxyData` may become `DataSource`.
