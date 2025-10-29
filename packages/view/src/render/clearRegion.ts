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
		releaseRegion(childRegion);
		// HACK: see runControlBranch
		childRegion.depth = -2;
		childRegion = childRegion.nextRegion;
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
		let currentNode = region.endNode;
		// DEBUG:
		//if (region.startNode.parentNode !== currentNode.parentNode) {
		//	throw new Error("region nodes have different parents");
		//}
		while (currentNode !== region.startNode) {
			let previousNode = currentNode.previousSibling;
			currentNode.remove();
			currentNode = previousNode!;
		}
		currentNode.remove();
	}
	releaseRegion(region);
}

function releaseRegion(region: Region) {
	region.startNode = null;
	region.endNode = null;
	region.previousRegion = null;
	region.nextRegion = null;
	region.animations = null;
}
