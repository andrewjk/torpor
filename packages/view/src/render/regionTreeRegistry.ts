import type Region from "../types/Region";

/**
 * Region trees created by `mount`/`hydrate`, keyed by the container they
 * were created into.
 *
 * Root-level calls (the usual `mount`/`hydrate` bootstrap) register the root
 * region, so `unmount` disposes exactly what was registered. Nested calls —
 * an embed hydrating server-rendered markup inside a live page — register a
 * region tree of their own, so their teardown (`unmount(parent)`) disposes
 * only the embed and leaves the host's render context alone. Without this,
 * hydrating an embed would replace the host's `rootRegion`/`previousRegion`
 * and the embed's teardown would clear the host's root.
 */
const trees = new Map<ParentNode, Region>();

export function registerRegionTree(parent: ParentNode, region: Region): void {
	trees.set(parent, region);
}

export function registeredRegionTree(parent: ParentNode): Region | undefined {
	return trees.get(parent);
}

export function unregisterRegionTree(parent: ParentNode): void {
	trees.delete(parent);
}

/** Entries for trees whose container lives inside `parent` (nested embeds). */
export function containedTrees(parent: ParentNode): Array<[ParentNode, Region]> {
	const found: Array<[ParentNode, Region]> = [];
	for (const entry of trees) {
		if (entry[0] !== parent && parent.contains(entry[0])) {
			found.push(entry);
		}
	}
	return found;
}
