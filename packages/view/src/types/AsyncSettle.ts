/**
 * The result of an `$async` computed's most recent generation-guarded settle —
 * written exactly once per settled generation by the `.then` handlers in
 * `$async` (and by hydration seeding), so it always reflects the last SETTLED
 * run, never a superseded run's in-flight promise.
 *
 * `undefined` until the first settle. This one field replaces the three
 * correlated fields it was previously spread across (`hasResolved` ⇔
 * `settle !== undefined`; `lastErrored` ⇔ `settle?.ok === false`;
 * `staleValue` ⇔ `settle.ok ? settle.value : undefined`), making impossible
 * combinations (resolved but never settled, errored with a retained stale
 * value) unrepresentable.
 */
type AsyncSettle = { ok: true; value: any } | { ok: false; error: any };

export default AsyncSettle;
