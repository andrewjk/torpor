---
"@torpor/view": patch
---

Fix: warn about duplicate `@key` values in keyed `@for` lists

`runListItems` matches old and new rows by key first-match-wins, so duplicate
`@key` values (e.g. two rows with `id: -1`) make updates and removals hit the
wrong regions and silently desync the DOM from the data. A dev-mode warning
now reports each duplicate key once per list (gated by `devContext.enabled`,
so it is a no-op in production builds), and unkeyed lists — which the
reconciler matches positionally — are ignored.
