import type ListItem from "../types/ListItem";
import type Region from "../types/Region";
import $run from "../watch/$run";
import clearRegion from "./clearRegion";
import context from "./context";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";

//import runListItems from "./runListItems";

/**
 * Runs a `for` control statement
 * @param create A function that creates the control statement's branches
 */
export default function runList(
	region: Region,
	parent: ParentNode,
	anchor: ChildNode | null,
	buildItems: (oldItems: Map<PropertyKey, ListItem>) => Map<PropertyKey, ListItem>,
): void {
	const oldRegion = pushRegion(region, true);

	let listItems = new Map<PropertyKey, ListItem>();

	// Run the list in an effect
	$run(function runList() {
		// Push and pop the control statement on subsequent runs, so that new
		// item regions will be added to its children
		const oldBranchRegion = pushRegion(region);

		// Build the array of items with keys and data
		const newItems = buildItems(listItems);

		// Do NOT re-run the list for properties accessed while updating its
		// items. E.g. we want to re-run the list for `@for (item of $items)`
		// (in buildItems, above) but not for `<span>{item.id}</span>` (in
		// runListItems, below)
		context.activeTarget = null;

		// TODO: if the number of items updated was the same as the old number
		// of items, we don't need to delete anything -- but i don't think we can do that
		let itemsToDelete: ListItem[] = [];
		//let oldKeys = [];
		let shift = 0;
		for (let oldItem of listItems.values()) {
			if (oldItem.state === 1) {
				oldItem.state = 0;
				oldItem.index -= shift;
				//oldKeys.push(oldKey);
			} else {
				itemsToDelete.push(oldItem);
				shift++;
			}
		}
		let i = itemsToDelete.length;
		while (i--) {
			// TODO: We could batch this -- do all animations etc and then just blow away the nodes??
			clearRegion(itemsToDelete[i]);
		}

		let oldKeys = Array.from(listItems.keys());

		interface MoveInfo {
			diff: number;
			to: number;
			num: number;
			startNode: Node | null;
			endNode: Node | null;
		}
		let moves: MoveInfo[] = [];
		let lastMove: MoveInfo | undefined;
		let newIndex = 0;
		for (let [_, newItem] of newItems) {
			// TODO: I guess we could do creating after things have moved? might
			// be faster?? and less complicated
			if (newItem.state === 2) {
				let newAnchor = anchor;
				let nextItem = newItem.nextRegion;
				let nextIndex = newIndex + 1;
				while (nextItem !== null && nextIndex < newItems.size) {
					if (nextItem.startNode !== null) {
						newAnchor = nextItem.startNode;
						break;
					}
					nextItem = nextItem.nextRegion;
					nextIndex++;
				}
				newItem.create(newAnchor);
				newItem.state = 0;
				lastMove = undefined;

				oldKeys.splice(newIndex, 0, newItem.key);
			} else {
				let diff = newIndex - newItem.index;
				if (diff !== 0) {
					newItem.index = newIndex;
					if (lastMove === undefined || lastMove.diff !== diff) {
						lastMove = {
							diff: diff,
							to: newIndex,
							num: 1,
							startNode: newItem.startNode,
							endNode: newItem.endNode,
						};
						moves.push(lastMove);
					} else {
						lastMove.num++;
						lastMove.endNode = newItem.endNode;
					}
				}
			}
			newIndex++;
		}

		if (moves.length > 0) {
			// Do the smallest moves first, and hopefully we won't need to do the big moves
			moves.sort((a, b) => a.num - b.num);

			for (let i = 0; i < moves.length; i++) {
				let move = moves[i];

				if (move.diff === 0) continue;

				// If the last item is the last list item, move before the
				// list's anchor node, otherwise move before the next item's
				// start node
				let newAnchor =
					move.to === newItems.size - 1 ? anchor : newItems.get(oldKeys[move.to])!.startNode;

				// TODO: Move as a document region / fragment??
				const endNode = move.endNode ?? move.startNode;
				let currentNode = move.startNode;

				while (currentNode !== null) {
					const nextNode = currentNode.nextSibling;
					try {
						parent.insertBefore(currentNode, newAnchor);
					} catch {
						// TODO:
					}
					if (currentNode === endNode) break;
					currentNode = nextNode;
				}

				let moved = oldKeys.splice(move.to - move.diff, move.num);
				oldKeys.splice(move.to, 0, ...moved);

				// If we moved backwards, anything between the lower
				// (destination) and upper (source) bounds should have its diff
				// shifted back by the extent

				// If we moved forwards, anything between the lower (source) and
				// upper (destination) bounds should have its diff shifted forward
				// by the extent

				// TODO: try storing these in the move instead of calculating them every time
				let lower: number;
				let upper: number;
				let delta: number;
				if (move.diff < 0) {
					lower = move.to;
					upper = move.to - move.diff;
					delta = -1 * move.num;
				} else {
					lower = move.to - move.diff;
					upper = move.to;
					delta = move.num;
				}
				for (let j = i + 1; j < moves.length; j++) {
					let move2 = moves[j];
					// TODO: Not sure about inclusivity here
					if (move2.to >= lower && move2.to <= upper) {
						move2.diff += delta;
					}
				}
			}
		}

		// Run the function that updates the list's items
		////runListItems(region, parent, anchor, listItems, newItems, create, update);

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

/*
function printLines(
	parent: ParentNode,
	lines: string[],
	currentNode: Node | null,
	endNode: Node | null,
	newAnchor: Node | null | undefined,
) {
	for (let node of parent.childNodes) {
		let html = "?";
		if (node.nodeType === Node.ELEMENT_NODE) {
			html = (node as Element).outerHTML;
		} else if (node.nodeType === Node.COMMENT_NODE) {
			html = `<!${(node as Comment).textContent}>`;
		} else if (node.nodeType === Node.TEXT_NODE) {
			html = (node as Text).textContent;
		}
		if (node === currentNode && node === endNode) {
			lines.push(`| ${html}`);
		} else if (node === currentNode) {
			lines.push(`⌜ ${html}`);
		} else if (node === endNode) {
			lines.push(`⌞ ${html}`);
		} else if (node === newAnchor) {
			lines.push(`> ${html}`);
		} else {
			if (html.trim().length) {
				lines.push(`  ${html}`);
			}
		}
	}
}
*/
