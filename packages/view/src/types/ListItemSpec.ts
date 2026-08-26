/**
 * A lightweight, per-row descriptor emitted by the compiler's `@for`
 * `buildItems` callback: just the key (for reconciliation) and the data bag
 * (the loop variables). Unlike a full {@link ListItem}, a spec carries no DOM
 * nodes, no effects, and no sibling-chain pointers — so allocating one per row
 * on every list update is cheap.
 *
 * The keyed-list reconciler (`runListItems`) maps each spec to either an
 * existing `ListItem` (matched by key, reused wholesale) or a freshly mounted
 * one (for genuinely new keys), keeping the per-update cost proportional to
 * what actually changed instead of to the list size.
 *
 * NOTE: `data` is `any` rather than `Record<string, any>` -- when a `@for`
 * body binds a single loop variable and is proxy-safe, the variable is stored
 * directly (e.g. `data: page` for a number), not as a bag.
 */
export default interface ListItemSpec {
	key: any;
	data: any;
}
