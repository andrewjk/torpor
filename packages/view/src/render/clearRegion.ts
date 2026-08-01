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

	// Clean up effects owned by this region
	for (const effect of region.effects) {
		if (typeof effect.cleanup === "function") {
			effect.cleanup();
			effect.cleanup = undefined;
		}
	}
	region.effects.length = 0;
}
