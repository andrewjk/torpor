/**
 * Type-level marker that documents a component prop as supporting two-way
 * binding via the `&` prefix at the call site.
 *
 * `Bindable<T>` is structurally just `T` — it has no runtime effect. It tells
 * component authors and consumers "this prop is intended to be bound with
 * `&prop={expr}`." Inside the component, use `$bind($state, $props, [...])`
 * to wire up the actual two-way sync.
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
