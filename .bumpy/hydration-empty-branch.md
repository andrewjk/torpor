---
"@torpor/view": patch
---

Fix: hydration of an empty `@if`/`@else` branch wiped adjacent siblings

An empty control block (its SSR output is only markers, e.g. a nested
`@if`/`else if` where no branch matched) emitted one `<!^>` branch-break marker
per non-taken branch. `nodeAnchor` stripped only the first, so the active
region captured a marker — or, when there were none, the `<!]>` end marker —
as its `startNode`. The end marker is then removed, leaving the region with a
detached start node, and a later `clearRegion` walked backwards past the
block and removed preceding siblings. `nodeAnchor` now skips all leading
branch-break markers and, for a block with no content, sets the region's
bounds to the anchor (matching `mount`).
