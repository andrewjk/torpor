import context from "../../global/context";
import Range from "../../global/types/Range";
import $run from "../../watch/$run";
import type ListItem from "../types/ListItem";
import popRange from "./popRange";
import pushRange from "./pushRange";
import pushRangeToParent from "./pushRangeToParent";
import runListItems from "./runListItems";

/**
 * Runs a `for` control statement
 * @param create A function that creates the control statement's branches
 */
export default function runList(
	range: Range,
	parent: ParentNode,
	anchor: Node | null,
	buildItems: () => ListItem[],
	create: (item: ListItem, anchor: Node | null) => void,
) {
	const oldRange = pushRangeToParent(range);

	let listItems: ListItem[] = [];

	// Run the list in an effect
	$run(function runList() {
		// Push and pop the control statement on subsequent runs, so that new item
		// ranges will be added to its children
		const oldBranchRange = pushRange(range);

		// Build the array of items with keys and data
		const newItems = buildItems();

		// Run the function that updates the list's items
		runListItems(parent, anchor, listItems, newItems, create);

		listItems = newItems;

		popRange(oldBranchRange);
	});

	// If we're mounting, the anchor will be the one that is passed in, but if
	// we're hydrating it will be after the items' HTML elements, so we need to
	// update it after all of the items have been hydrated
	if (context.hydrationNode) {
		anchor = context.hydrationNode.nextSibling;
	}

	popRange(oldRange);
}
