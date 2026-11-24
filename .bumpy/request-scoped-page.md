---
"@torpor/build": minor
---

!Fix: give each request its own $page state, via $context

BREAKING: `$page` is no longer exported from `@torpor/build/state`; read it from the context with `let { $page } = $context;`.
