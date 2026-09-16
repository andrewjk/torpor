---
"@torpor/build": patch
---

Fix: endpoints can return fetched Responses

`addHeaders` appended set-cookie/CORS headers directly to the
response, but the headers of a Response obtained from `fetch()` are
immutable in undici -- an endpoint relaying a peer's Response (e.g.
returning the error response from a cross-site fetch) threw an
unhandled `TypeError: immutable` that killed the whole node process.
`addHeaders` now catches the TypeError, swaps in a mutable clone of
the response, and writes the headers to that instead.
