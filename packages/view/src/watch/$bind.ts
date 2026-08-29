import $run from "./$run";

/**
 * Establishes two-way reactive sync between matching keys on a state object
 * and a props object.
 *
 * For each key, `$bind` creates:
 * - **Forward sync** (`props → state`): when the parent pushes a new value via
 *   `$props[key]`, it flows into `$state[key]`. Skips `undefined` values so
 *   that defaults set in the initial `$watch(...)` are preserved when the
 *   parent doesn't provide a value.
 * - **Backward sync** (`state → props`): when the component mutates
 *   `$state[key]`, the new value is written back to `$props[key]`, which the
 *   call site's `&key={...}` binding picks up and propagates to the parent.
 *
 * Same-value writes are no-ops (handled by the proxy layer), so two-way sync
 * stabilises without infinite loops.
 *
 * `$bind` syncs same-named keys, so the key must exist on the state object.
 * A state key named differently from the prop (e.g. `values` against a
 * `value` prop) would silently do nothing -- the binding reads and writes
 * keys that nothing else touches -- which is almost impossible to debug. The
 * key is therefore required to exist on the state object, and `$bind` throws
 * at setup otherwise.
 *
 * The prop does *not* need to exist on `props` yet: when the parent doesn't
 * pass an optional prop, the compiled props object has no key for it, and
 * the binding is simply inert (uncontrolled mode) until a value is pushed.
 *
 * @param state The component's reactive state (created via `$watch`).
 * @param props The component's `$props` proxy. When `undefined` (component
 *   called with no props), `$bind` does nothing.
 * @param keys Keys to sync. Each key must exist on `state`.
 * @throws When a key does not exist on the state object.
 */
export default function $bind(
	state: Record<PropertyKey, any>,
	props: Record<PropertyKey, any> | undefined,
	...keys: (string | string[])[]
): void {
	if (props === undefined) return;
	for (let key of keys.flat()) {
		if (!(key in state)) {
			throw new Error(
				`$bind: the key "${key}" does not exist on the state object. ` +
					`$bind syncs same-named keys, so the state object must declare it (e.g. in the initial $watch).`,
			);
		}
		// Forward: props → state (skip undefined so $watch defaults survive)
		$run(() => {
			const v = props[key];
			if (v !== undefined) state[key] = v;
		}, `bind:forward:${key}`);
		// Backward: state → props (skip the initial write — there's nothing to
		// propagate yet, and echoing the initial state into props would make
		// the forward effect fire spuriously and clobber state changes that
		// happen during mount). The read still subscribes us to state[key].
		let firstBackward = true;
		$run(() => {
			const value = state[key];
			if (!firstBackward) props[key] = value;
			firstBackward = false;
		}, `bind:backward:${key}`);
	}
}
