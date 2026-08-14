import devContext from "../dev/devContext";
import type Region from "../types/Region";

export default function clearRegion(region: Region): void {
	//console.log("clearing region", region.name, "from", region.startNode, "to", region.endNode);

	// DEV:
	devContext.onRegionCleared(region);

	// Clear child regions and collect animations that take place within this
	// region and its children
	let animations: Animation[] | undefined =
		region.animations !== null ? Array.from(region.animations) : undefined;
	let childRegion = region.nextRegion;
	while (childRegion !== null && childRegion.depth > region.depth) {
		if (childRegion.animations !== null) {
			animations ??= [];
			animations.push(...childRegion.animations);
		}
		const nextChild = childRegion.nextRegion;
		releaseRegion(childRegion);
		// HACK: see runControlBranch
		childRegion.depth = -2;
		childRegion = nextChild;
	}
	region.nextRegion = childRegion;

	if (region.previousRegion !== null) {
		region.previousRegion.nextRegion = region.nextRegion;
	}
	if (region.nextRegion !== null) {
		region.nextRegion.previousRegion = region.previousRegion;
	}

	// Wait for animations, if any, then clear the region's nodes
	if (animations !== undefined) {
		animations.forEach((a) => {
			a.reverse();
			a.play();
		});
		// eslint-disable-next-line no-floating-promises
		Promise.all(animations.map((a) => a.finished)).then(() => clearNodes(region));
	} else {
		clearNodes(region);
	}
}

function clearNodes(region: Region) {
	// Clear the nodes for this region
	if (region.startNode !== null && region.endNode !== null) {
		// The node that follows the region's content, captured before any
		// removal — after the backward walk below, it is the first remaining
		// node at the region's position (e.g. the control's anchor that
		// branch content was rendered before).
		const after = region.endNode.nextSibling;

		// The stop boundary is normally the region's own start node. But when
		// an inner control (e.g. an @if inside a @for item) has re-rendered and
		// replaced the nodes the start node originally pointed at, the start
		// node becomes detached from the DOM. In that case fall back to the
		// preceding sibling region's end node (walking past any deeper child
		// regions that link this region to its sibling), so we only clear this
		// region's content instead of walking past it into a previous sibling.
		let stop: Node | null = region.startNode;
		const startDetached = region.startNode.parentNode === null;
		let fallback = false;
		if (startDetached) {
			let prev: Region | null = region.previousRegion;
			while (prev !== null && prev.depth > region.depth) {
				prev = prev.previousRegion;
			}
			if (prev !== null && prev.endNode !== null && prev.endNode.parentNode !== null) {
				stop = prev.endNode;
				fallback = true;
			}
		}
		let currentNode = region.endNode;
		while (currentNode !== null && currentNode !== stop) {
			let previousNode = currentNode.previousSibling;
			currentNode.remove();
			if (previousNode === null) {
				// The region's node chain is no longer connected — everything
				// that still needs clearing has been cleared.
				break;
			}
			currentNode = previousNode;
		}
		// When clearing against the region's own start node, remove it too.
		// When using the fallback (previous sibling's end node), leave it — it
		// belongs to the sibling.
		if (!fallback && currentNode === region.startNode) {
			currentNode.remove();
		}

		// Repair ancestor node windows whose start node was just removed.
		//
		// When a control branch's content is cleared, ancestor regions whose
		// window was WIDENED to that content (see widenAncestorsAtAnchor) are
		// left with a detached startNode. A later moveRegion on such an
		// ancestor would resurrect the detached node (insertBefore re-attaches
		// it). Reset any detached ancestor start to the first node that
		// remains at the cleared position: the node after the removed span —
		// `after`, or `stop` when the fallback kept the preceding sibling's
		// end node as the boundary.
		const firstRemaining = (fallback ? stop : after) as ChildNode | null;
		if (firstRemaining !== null) {
			let ancestor: Region | null = region.previousRegion;
			let ancestorDepth = region.depth;
			while (ancestor !== null && ancestor.depth < ancestorDepth) {
				if (ancestor.startNode !== null && ancestor.startNode.parentNode === null) {
					ancestor.startNode = firstRemaining;
				}
				ancestorDepth = ancestor.depth;
				ancestor = ancestor.previousRegion;
			}
		}
	}
	releaseRegion(region);
}

function releaseRegion(region: Region) {
	(region as any).generation = -1;
	region.startNode = null;
	region.endNode = null;
	region.previousRegion = null;
	region.nextRegion = null;
	region.animations = null;

	// Clean up effects owned by this region. For each effect we both run its
	// optional cleanup function AND detach every source subscription from the
	// source signal's `firstTarget` list. Without the detach, the destroyed
	// effect stays in `signal.firstTarget` forever — every subsequent change
	// to any of its sources re-queues the (no-longer-reachable-via-DOM)
	// effect, which re-runs, re-subscribes, and leaks indefinitely. This is
	// the dominant cost in long-lived sessions where list items are
	// repeatedly created and cleared (e.g. js-framework-bench iterations).
	for (const effect of region.effects) {
		if (typeof effect.cleanup === "function") {
			effect.cleanup();
			effect.cleanup = undefined;
		}

		// Detach every source subscription from its signal's target list.
		// `clearSources` only removes subscriptions marked inactive, but a
		// freshly-destroyed effect's subscriptions are still active (they
		// were never marked inactive because the effect was never re-run),
		// so we walk and unlink explicitly.
		let sub = effect.firstSource;
		effect.firstSource = null;
		while (sub !== null) {
			const nextSource = sub.nextSource;

			// Unlink this subscription from the signal's target list (the
			// doubly-linked `previousTarget`/`nextTarget` chain).
			const prev = sub.previousTarget;
			const next = sub.nextTarget;
			if (prev === null) {
				// We're the head of the signal's target list — promote the
				// next target, but only if we still are the head. A popular
				// signal may have had new subscriptions prepended since this
				// sub was created, in which case `firstTarget` no longer
				// points at us and the head has already moved on.
				if (sub.source.firstTarget === sub) {
					sub.source.firstTarget = next;
				}
			} else {
				prev.nextTarget = next;
			}
			if (next !== null) {
				next.previousTarget = prev;
			}

			// Clear pointers so this subscription is no longer reachable
			// from either list, even transitively.
			sub.previousTarget = null;
			sub.nextTarget = null;
			sub.nextSource = null;

			sub = nextSource;
		}
	}
	region.effects.length = 0;
}
