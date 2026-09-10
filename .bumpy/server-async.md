---
"@torpor/view": minor
"@torpor/build": minor
---

Feat: opt-in server-side fetching for async data

`$async` getters can now fetch during the server render with
`{ source: "server" }`: the `@await` boundary ships its content resolved
(with values embedded for hydration -- no fallback flash, and dependency
changes still re-fetch on the client), and degrades to the `with` branch +
client fetch on a timeout (`timeout`, default 5000ms), a rejection, or a
client-fetch getter inside the boundary. Streaming delivery may be added
later without the option changing.

To support this, compiled server components are now `async` functions
returning `Promise<{ body, head }>`, and `ServerComponent` /
`ServerSlotRender` are typed accordingly -- call sites (including
`loadView`) await the result, which also accepts the old plain-object
shape. Most of the work is detailed in `packages/view/ASYNC.md`.

Also: the test harness now maps every runtime helper import to source, so
view tests no longer silently run a stale built package.
