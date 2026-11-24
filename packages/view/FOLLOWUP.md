# Follow-ups

Findings from a review of `packages/view`.

## Limitations

### Non-plain objects are opaque to `$watch`

`$watch`/`deepWrap` only proxy plain objects, plain arrays, and exact `Date`,
`Map` and `Set` instances. Class instances, array/collection subclasses,
`RegExp`, typed arrays, frozen / non-extensible objects and other exotic
objects are returned unchanged.
Replacing the property that holds one still triggers effects, but mutating it
in place is not reactive.

Proxying arbitrary instances isn't transparent: methods that need internal
slots or `#private` fields throw when called with the proxy as `this`. Those
objects therefore stay opaque, which also means prototype getters/methods
aren't tracked and `$cache`/`$async` can't be used in class getters. Keep
reactive state in plain objects/arrays; class getters can still read a watched
plain object and track those reads.

## Compiler

- There are 89 `TODO` / `HACK` / `FIXME` markers under `src/`, and 23
  commented-out `console.log`s (plus a commented-out debug `printPath` block
  at the end of `compile/build/client/buildFragment.ts`). Worth a pruning
  pass: turn the real ones into entries here and delete the rest.
