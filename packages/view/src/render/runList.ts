import type ListItem from "../types/ListItem";
import type ListItemSpec from "../types/ListItemSpec";
import type Region from "../types/Region";
import $run from "../watch/$run";
import context from "./context";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";
import runListItems from "./runListItems";

/**
 * Runs a `for` control statement
 * @param buildItems A function that returns the current list of lightweight
 *   `{key, data}` specs (one per row of the source data)
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
	buildItems: () => ListItemSpec[],
	create: (item: ListItem, anchor: Node | null) => void,
	update: (oldItem: ListItem, newSpec: ListItemSpec) => void,
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

		// Build the array of lightweight {key, data} specs for the new data
		const newSpecs = buildItems();

		// Do NOT re-run the list for properties accessed while updating its
		// items. E.g. we want to re-run the list for `@for (item of $items)`
		// (in buildItems, above) but not for `<span>{item.id}</span>` (in
		// runListItems, below)
		context.activeTarget = null;

		// Reconcile: reuse old ListItems for survivors, mount fresh ones for
		// new keys, clear dropped ones. Returns the new live list, which we
		// keep for the next run.
		listItems = runListItems(region, parent, anchor, listItems, newSpecs, create, update, noWatch);

		popRegion(oldRegion);
	});
}
