---
"@torpor/build": minor
---

!Feat: run folder hooks before route middleware

BREAKING: Route `middleware` now runs after the folder hooks (`_hook.server.ts`), not before; it can read their data from `ev.appData`. Hooks also now run before params and query validation for loads and endpoints.
