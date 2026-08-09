/**
 * Marks a component prop as supporting two-way binding via the `&` prefix.
 *
 * When a prop is typed `Bindable<T>`, the compiler automatically generates a
 * write-back effect that syncs `$state[propName]` → `$props[propName]`
 * whenever the component's internal state changes, so that `&prop={expr}`
 * on the call site works without any manual `$props.x = $state.x` boilerplate.
 *
 * The component author is still responsible for the forward sync
 * (`$state.x = $props.x`) when initial or external values need to flow in.
 *
 * Example:
 * ```ts
 * interface MyProps {
 *     value: Bindable<string>;
 * }
 * ```
 */
type Bindable<T> = T;

export default Bindable;
