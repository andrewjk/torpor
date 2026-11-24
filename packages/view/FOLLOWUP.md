# Follow-ups

Findings from a review of `packages/view`. "Confirmed" items were reproduced
with throwaway tests (since deleted); the rest come from reading the source.

## Bugs

### Deep-wrapping breaks built-ins and class instances (confirmed)

`deepWrap` wraps every non-promise, non-DOM object, but only Date/Map/Set
get method forwarding. Methods that need internal slots or private fields
throw once the object is stored in watched state:

- `RegExp` -- `s.re.test("a")` throws "incompatible receiver".
- Typed arrays -- `s.u.subarray(0, 1)` throws.
- Class instances with `#private` fields -- methods throw "Cannot read
  private member".
- Frozen / non-extensible objects -- `$watch` itself throws, because
  `Object.defineProperty(object, proxyDataSymbol, …)` fails.

Either only deep-wrap plain objects and arrays (prototype is
`Object.prototype`, `null` or `Array.prototype`) plus the supported
collections, or keep per-object metadata in a `WeakMap` instead of on the
target. That would also fix frozen objects.

### Smaller reactivity issues

- **`$cache` / `$async` don't work in class getters** (confirmed): a
  prototype getter has no own property descriptor, so `registerComputed`
  is never set up and `$cache` throws "$cache must be used in a getter".
  Either support prototype accessors or document that reactive state must
  be an object literal.

## Compiler

- **`isReactive` / `isFullyReactive` / `createText`** decide reactivity by
  `text.includes("{") && text.includes("}")` (TODOs in each), so they're
  fooled by braces in strings and comments.
- **`parseImports`** is a hand-rolled line scanner (`HACK: Really need to
  properly parse imports`). It stops at the first line that isn't an import
  or a `//` comment, so imports after a `/* */` block or a directive are
  missed. Its result (`template.imports`) is only lightly used today
  (`bindingTarget`), but anything building on it should use a real parser
  (the oxc parser is already in the toolchain).
- There are 89 `TODO` / `HACK` / `FIXME` markers under `src/`, and 23
  commented-out `console.log`s (plus a commented-out debug `printPath` block
  at the end of `compile/build/client/buildFragment.ts`). Worth a pruning
  pass: turn the real ones into entries here and delete the rest.
