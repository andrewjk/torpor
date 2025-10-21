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
 */
export default function runList(
	region: Region,
	parent: ParentNode,
	anchor: Node | null,
	buildItems: () => ListItem[],
	create: (item: ListItem, anchor: Node | null) => void,
	update: (oldItem: ListItem, newItem: ListItem) => void,
): void {
	const oldRegion = pushRegion(region, true);

	let listItems: ListItem[] = [];

	// Run the list in an effect
	$run(function runList() {
		// Push and pop the control statement on subsequent runs, so that new
		// item regions will be added to its children
		const oldBranchRegion = pushRegion(region);

		// Build the array of items with keys and data
		const newItems = buildItems();

		// Do NOT re-run the list for properties accessed while updating its
		// items. E.g. we want to re-run the list for `@for (item of $items)`
		// (in buildItems, above) but not for `<span>{item.id}</span>` (in
		// runListItems, below)
		context.activeTarget = null;

		// Run the function that updates the list's items
		runListItems(region, parent, anchor, listItems, newItems, create, update);

		listItems = newItems;

		popRegion(oldBranchRegion);
	});

	// If we're mounting, the anchor will be the one that is passed in, but if
	// we're hydrating it will be after the items' HTML elements, so we need to
	// update it after all of the items have been hydrated
	if (context.hydrationNode !== null) {
		anchor = context.hydrationNode.nextSibling;
	}

	popRegion(oldRegion);
}
