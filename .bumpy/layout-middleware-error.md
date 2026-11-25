---
"@torpor/build": minor
---

!Fix: reject middleware on layout server endpoints

BREAKING: A `_layout.server.ts` that exports `middleware` (which was silently ignored) now throws; move the guard into a `_hook.server.ts` in the same folder, and type layout endpoints with `LayoutServerEndPoint`.
