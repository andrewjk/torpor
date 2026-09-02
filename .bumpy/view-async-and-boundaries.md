---
"@torpor/view": minor
---

- Async components: `@await` boundaries with suspend/fallback branches, `$pending` reactive query state, `$stream` for subscribing to events and `$refresh` for refetching data
- Error boundaries: `@try`/`@catch` in `@render` blocks plus top-level `@error`
- Two-way binding with `Bindable<T>` and `$bind`; `$handle` for skipping an event's first run; `$mount` renamed to `$onmount`
- Spread attributes on elements and spread props on components
- Reactive `Date`/`Set`/`Map` proxy wrappers, replacing `ReactiveDate`
- Whitespace is now trimmed by default
- Performance: delegated events, single-element fragments, signal reuse and `@for` no-proxy specialization
- Fixes for SSR text escaping, hydration edge cases, circular imports and optional-chaining bindings
