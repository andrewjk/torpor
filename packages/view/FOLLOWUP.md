# Follow-ups

Findings from a review of `packages/view`.

## Compiler

There are 89 `TODO` / `HACK` / `FIXME` markers under `src/`, and 23
commented-out `console.log`s (plus a commented-out debug `printPath` block
at the end of `compile/build/client/buildFragment.ts`), covering the following:

- **Component props**: default values and proper parameter→prop mapping are
  missing; prop source maps are approximate; `Bindable<T>` could be surfaced
  in the `$props` interface so two-way bindings type-check.
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

## Features

### `@defer`: load and hydrate a block later

A block whose server HTML ships with the page but whose code loads (and
hydrates) only when a trigger fires, in the spirit of Angular's
`@defer (on viewport) { ... } @placeholder { ... }` and Nuxt's lazy hydration:

```torp
@defer (on: "visible") {
	<Repl input={code} />
}
```

**Why.** The docs site needed exactly this for its REPL (whose compiler is
~87 kB gzipped) and got it by hand: `site/src/views/repl/Repl.torp` splits
the heavy code into `compileRepl.ts`, loads it with a dynamic `import()`
from an `IntersectionObserver` (rooted at the nearest scrolling ancestor,
since the docs layout scrolls `#content` rather than the window) or on
focus, and shows a same-sized placeholder until then. That took docs pages
from ~133 kB to ~48 kB before hydration. The build's page size report
(`@torpor/build`, `site.budgets`) now shows the next candidates: the
`@torpor/ui` charts, date pickers and form pages at 55-77 kB.

**Not islands.** Islands (static pages where only marked components ship
code and hydrate, independently) invert torpor's model: hydration runs
from the root, `$context` flows down from it, props into an island would
have to be serializable, and client navigation re-renders layouts. A
deferred block stays part of its parent component -- it still gets
`$context`, reads the parent's reactive state, and works with client
navigation; only its code arrives late. It covers most of what islands are
wanted for, and would replace the "zero-JS pages / islands" item in
`packages/build/FOLLOWUP.md` (a route flag that leaves out client scripts
entirely is still a separate, simpler option for pure content pages).

**Semantics.**

- **Server**: renders the block's content in full, so HTML, SEO and first
  paint are unchanged.
- **Compiler**: a component used _only_ inside `@defer` blocks has its
  static import rewritten to a dynamic one, so it (and everything it pulls
  in) lands in its own chunk. The build's `modulepreload` links follow
  static imports only, so the chunk isn't preloaded. A component also used
  outside a `@defer` stays a static import (nothing to gain).
- **Client**: hydration skips the block's region, leaving the server DOM in
  place, then on the trigger imports the chunk and hydrates the region in
  place. Client-side renders (navigation, `@if` toggling the block in) can
  either load and render immediately or apply the same trigger; immediate
  is simpler and probably right.
- **Triggers**: `"visible"` (within about a screen of the visible area, with
  the observer rooted at the nearest scrolling ancestor, as the REPL does),
  `"idle"` (`requestIdleCallback`), `"interaction"` (focus, pointer or key
  inside the block), and possibly a media query (`"media: (min-width:
  60rem)"`).
- **Before the trigger** the HTML is inert: native controls work (the REPL's
  textarea is editable) but torpor handlers don't run. An optional
  `@placeholder` branch would cover content that shouldn't show inert;
  interaction triggers could replay the first event after hydrating.

**Hard parts.**

- Hydrating a region later. Hydration walks the DOM in one pass; it would
  need to skip a marked region (the `@await` boundaries' `<![>...<!]>`
  markers are a starting point) and resume there with the right region
  parent and context. `source: "server"` `@await` already adopts server
  HTML instead of re-rendering, which is related machinery.
- The import rewrite: deciding that every use of a component is inside a
  `@defer`, and handling components passed around as values (`@component
  self=...`, slots).
- Server state: values the deferred content read on the server have to be
  available when it hydrates (props from the parent are; its own `$async {
  source: "server" }` payloads ride in the HTML already).
