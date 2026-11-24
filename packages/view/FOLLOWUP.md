# Follow-ups

Findings from a review of `packages/view`. "Confirmed" items were reproduced
with throwaway tests (since deleted); the rest come from reading the source.

## Bugs

### Array read methods run on raw elements, so reads aren't tracked (confirmed)

`watch/proxyGet.ts` routes `filter`, `map`, `find`, `some`, `every`,
`reduce`, `forEach`, `at`, … through `readHandle`, which calls them on the
raw target. Elements that haven't been wrapped yet (no earlier
iteration or `arr[i]` read) are passed to callbacks and returned raw:

```ts
const s = $watch({ todos: [{ done: false }, { done: false }] });
$run(() => (n = s.todos.filter((t) => !t.done).length));
s.todos[0].done = true; // n stays 2
```

```ts
const t = s.todos.find((x) => x.id === 1); // raw object
t.done = true; // nothing re-runs
```

The `remaining` / `find-then-mutate` patterns are common, and whether they
work depends on whether something happened to read the array through the
proxy first. Wrap elements lazily in `readHandle` (as the iterator already
does), or pass proxies to the callbacks.

Related: once elements are wrapped and written back, the target holds
proxies, so `indexOf(rawObj)` / `includes(rawObj)` return `-1` / `false`
for objects that are in the array.

### "Cycle detected" fires for large, non-cyclic flushes (confirmed)

`proxySet` throws when `context.batchOperation > 100`, and
`batchOperation` counts every effect run in the flush. Any write made after
100 effects have run in one flush throws, cycle or not:

```ts
for (let i = 0; i < 150; i++) $run(() => s.a);
$run(() => {
	s.out = s.a * 2;
});
s.a = 1; // throws "Cycle detected"
```

A page with 100+ effects reacting to one change (a long list) plus any
effect that writes state (`$bind`'s backward sync, derived writes) will hit
this. Count re-runs per effect instead (e.g. the same effect running more
than N times in a flush).

### `$peek` loses tracking if its callback throws (confirmed)

`watch/$peek.ts` restores `context.activeTarget` without `try/finally`. If
`fn` throws and the caller catches, the rest of the running effect is
untracked, so later reads in it never re-run it. Use `try/finally`.

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

### `unmount()` on a never-mounted element tears down the app (confirmed)

`render/unmount.ts`: when `parent` has no registered region tree, the `else`
branch clears `context.rootRegion`. Calling `unmount(someEmptyDiv)` disposes
the whole running page (its effects stop and its content is cleared).
Unregistered parents should be a no-op, apart from removing their own
children.

### A mount that throws leaves the render context dirty (confirmed)

`render/mount.ts` sets `context.rootRegion` and pushes the root region, then
calls the component without `try/finally`. If rendering throws,
`rootRegion` stays set and a nested mount's `saved` context is never
restored, so the next `mount` is treated as nested. Restore the context
(and unregister the half-built tree) in a `finally`.

### Smaller reactivity issues

- **`NaN` writes always notify** (confirmed): `proxySet` compares with
  `!==`, so `s.a = NaN` re-runs effects every time while `a` is already
  `NaN`. Use `Object.is`.
- **`in` isn't tracked** (confirmed): there's no `has` trap, so
  `"k" in s` inside an effect doesn't re-run when `k` is added. Add a `has`
  trap that subscribes to the key (or to `proxyKeysSymbol`).
- **Map/Set `delete` of a missing key notifies** (confirmed): it re-runs
  `size` / iteration readers although nothing changed. Check the result of
  `target.delete` first.
- **Index writes always notify `length`** (confirmed, known TODO in
  `proxySet`): `arr[0] = 9` re-runs every `length` reader, including whole
  `@for` lists.
- **`$cache` / `$async` don't work in class getters** (confirmed): a
  prototype getter has no own property descriptor, so `registerComputed`
  is never set up and `$cache` throws "$cache must be used in a getter".
  Either support prototype accessors or document that reactive state must
  be an object literal.

## Compiler

- **Inline `<script>` / `<style>` contents are parsed as template**
  (confirmed): `<script>const a = { b: 1 };</script>` compiles to
  `${t_fmt( b: 1 )}`, and `<style>@media …</style>` fails with "Unknown
  operation: @media". The documented escapes (`&#123;`, `&#64;`) don't help
  here because entities aren't decoded inside raw-text elements. Treat
  `<script>` / `<style>` (and maybe `<pre><code>`) contents as raw, or
  document that they must be set via `@html` or the `@style` block.
- **Static quoted attributes interpolate braces**: `data-x='{"a":1}'`
  becomes `${t_attr("a":1)}`, which is a syntax error in the generated code
  rather than a parse error with a location. If interpolation inside quoted
  attributes is intended, point the error at the attribute and mention the
  `&#123;` escape.
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

## Duplication and inconsistencies

- Client and server helpers exist in pairs (`render/formatText` vs
  `ssr/formatText`, `render/buildClasses` vs `ssr/buildClasses`, …), and the
  escaping rules are split between `ssr/formatText.ts` and
  `render/formatAttributeText.ts`. A single `ssr/escape.ts` used by all
  server helpers would make the rules harder to miss.
- Every `$x` primitive has a `ssr/$serverX.ts` twin. Fine by design, but
  nothing checks that the two export identical signatures. A type-level test
  (`satisfies typeof $bind`, etc.) would catch drift.
