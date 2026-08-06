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
 */
export default interface ListItemSpec {
	key: any;
	data: Record<string, any>;
}
