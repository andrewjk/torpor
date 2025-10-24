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
	anchor: Node | null,
	buildItems: (
		oldItems: Map<PropertyKey, ListItem>,
		toDelete: ListItem[],
	) => Map<PropertyKey, ListItem>,
	//create: (item: ListItem, anchor: Node | null) => void,
	//update: (oldItem: ListItem, newItem: ListItem) => void,
): void {
	const oldRegion = pushRegion(region, true);

	let listItems = new Map<PropertyKey, ListItem>();

	// Run the list in an effect
	$run(function runList() {
		// Push and pop the control statement on subsequent runs, so that new
		// item regions will be added to its children
		const oldBranchRegion = pushRegion(region);

		// Build the array of items with keys and data
		let itemsToDelete: ListItem[] = [];
		const newItems = buildItems(listItems, itemsToDelete);

		// Do NOT re-run the list for properties accessed while updating its
		// items. E.g. we want to re-run the list for `@for (item of $items)`
		// (in buildItems, above) but not for `<span>{item.id}</span>` (in
		// runListItems, below)
		context.activeTarget = null;

		// TODO: if the number of items updated was the same as the old number
		// of items, we don't need to delete anything -- but i don't think we can do that
		//let oldItems = Array.from(listItems.entries());
		//let i= oldItems.length;
		let shift = 0;
		for (let [_, oldItem] of listItems) {
			if (oldItem.state === 1) {
				oldItem.state = 0;
				oldItem.index -= shift;
			} else {
				itemsToDelete.push(oldItem);
				shift++;
			}
		}
		let i = itemsToDelete.length;
		while (i--) {
			clearRegion(itemsToDelete[i]);
		}

		interface MoveInfo {
			diff: number;
			to: number;
			num: number;
			startNode: Node | null;
			endNode: Node | null;
			// TODO: Not sure if this will be correct by the time it comes to do the move!
			lastItem: ListItem;
		}
		let moves: MoveInfo[] = [];
		let lastMove: MoveInfo | undefined; // { i: -1, extent: -1 };
		let newIndex = 0;
		for (let [_, newItem] of newItems) {
			// TODO: I guess we could do creating after things have moved? might
			// be faster?? and less complicated
			if (newItem.state === 2) {
				let newAnchor = anchor;
				let nextItem = newItem.nextRegion;
				while (nextItem !== null) {
					if (nextItem.startNode !== null) {
						newAnchor = nextItem.startNode;
						break;
					}
					nextItem = nextItem.nextRegion;
				}
				newItem.create(newAnchor);
				// TODO: ^^^ dedupe this
				newItem.state = 0;
				// TODO: Set this in buildFroNode
				newItem.index = newIndex;
				lastMove = undefined;
			} else {
				// TODO: Instead of having newIndex, just use i here
				let diff = /*newItem.newIndex*/ newIndex - newItem.index;
				if (diff !== 0) {
					newItem.index = newIndex;
					if (lastMove === undefined || lastMove.diff !== diff) {
						lastMove = {
							diff: diff,
							to: newIndex,
							num: 1,
							startNode: newItem.startNode,
							endNode: newItem.endNode,
							lastItem: newItem,
						};
						moves.push(lastMove);
					} else {
						lastMove.num++;
						lastMove.endNode = newItem.endNode;
						lastMove.lastItem = newItem;
					}
				}
			}
			newIndex++;
		}
		let lastIndex = newIndex - 1;

		if (moves.length > 0) {
			// Do the smallest moves first, and hopefully we won't need to do the big moves
			moves.sort((a, b) => a.num - b.num);
			console.log(moves.map((m) => ({ diff: m.diff, to: m.to, num: m.num })));

			//console.log("FROM", JSON.stringify(Array.from(newItems.values()), null, 2));

			for (let i = 0; i < moves.length; i++) {
				let move = moves[i];

				if (move.diff === 0) continue;

				// If the last item is the last list item, move before the
				// list's anchor node, otherwise move before the next item's
				// start node
				let newAnchor =
					//move.lastItem.nextRegion === region.nextRegion
					move.to === lastIndex ? anchor : move.lastItem.nextRegion?.startNode;

				// TODO: Move as a document region / fragment??
				//export default function moveRegion(parent: Node, region: Region, before: ChildNode | null): void {
				//parent = before?.parentNode ?? parent;
				const endNode = move.endNode ?? move.startNode;
				let currentNode = move.startNode;

				console.log("MOVING FROM", move.to - move.diff, "TO", move.to);

				let lines = ["BEFORE"];
				printLines(parent, lines, currentNode, endNode, newAnchor);
				console.log(lines.join("\n"));

				while (currentNode !== null) {
					const nextNode = currentNode.nextSibling;
					parent.insertBefore(currentNode, newAnchor!);
					if (currentNode === endNode) break;
					currentNode = nextNode;
				}
				//}

				// If we moved backwards, anything between the lower
				// (destination) and upper (source) bounds should have its diff
				// shifted back by the extent

				// If we moved forwards, anything between the lower (source) and
				// upper (destination) bounds should have its diff shifted forward
				// by the extent

				lines = ["AFTER"];
				for (let node of parent.children) {
					lines.push(node.outerHTML);
				}
				console.log(lines.join("\n"));

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
				console.log(lower, "->", upper);
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
