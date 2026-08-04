import type ListItem from "../types/ListItem";
import type Region from "../types/Region";
import $run from "../watch/$run";
import context from "./context";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";
import runListItems from "./runListItems";

/**
 * Runs a `for` control statement
 * @param create A function that creates the control statement's branches
 * @param noWatch When true, the compiler has determined the `@for` body never
 *   writes to its loop variables, so each item's `data` bag can be left
 *   unwrapped (skipping the per-item shallow `$watch` Proxy + ProxyData +
 *   signals Map allocations). The compiler-emitted `update` callback is then
 *   responsible for re-running item effects when a loop variable's reference
 *   actually changes (via `t_rerun_region_effects`).
 */
export default function runList(
	region: Region,
	parent: ParentNode,
	anchor: Node | null,
	buildItems: () => ListItem[],
	create: (item: ListItem, anchor: Node | null) => void,
	update: (oldItem: ListItem, newItem: ListItem) => void,
	noWatch?: boolean,
): void {
	let first = true;
	let listItems: ListItem[] = [];

	// Run the list in an effect
	$run(function runList() {
		// If this region has been cleared (e.g. a parent @if switched to a
		// different branch), skip the update — the list will be re-created
		// when the parent branch re-renders
		if (region.depth === -2) return;

		const oldRegion = pushRegion(region, first);
		first = false;

		// Build the array of items with keys and data
		const newItems = buildItems();

		// Do NOT re-run the list for properties accessed while updating its
		// items. E.g. we want to re-run the list for `@for (item of $items)`
		// (in buildItems, above) but not for `<span>{item.id}</span>` (in
		// runListItems, below)
		context.activeTarget = null;

		// Run the function that updates the list's items
		runListItems(region, parent, anchor, listItems, newItems, create, update, noWatch);

		listItems = newItems;

		popRegion(oldRegion);
	});
}
