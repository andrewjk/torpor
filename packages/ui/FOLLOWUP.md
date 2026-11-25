# Follow-ups

## `getId()` counts across server requests

`src/utils/getId.ts` keeps one module-level counter. On the server it never
resets, so every request renders different ids (`torp-id-0` on the first
request, `torp-id-2` on the next, ...), and concurrent renders interleave
theirs. That has two effects:

- The server's ids don't match the ones the client generates when it
  hydrates (which start from 0), so `aria-controls`, `aria-labelledby`
  and `for` attributes can point at the wrong elements after hydration.
- Every page using these components renders different HTML each time, so
  `@torpor/build`'s content ETags never match and pages never get a 304
  (seen on the docs site's `/build/caching`).

The server needs a counter per render (e.g. one carried on the root
`$context`, which `@torpor/build` now passes per request), while the
client keeps a document-wide counter so ids stay unique across client
navigations that keep a layout.
