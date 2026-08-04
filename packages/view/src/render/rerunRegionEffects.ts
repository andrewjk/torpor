import type Region from "../types/Region";
import clearSources from "../watch/clearSources";
import deactivateSources from "../watch/deactivateSources";
import runCleanups from "../watch/runCleanups";
import runEffect from "../watch/runEffect";

/**
 * Force re-runs every effect owned by `region` and its descendant regions.
 *
 * Used by keyed-list `updateListItem` callbacks emitted by the compiler when
 * the `@for` body has been classified "no-proxy safe" — i.e. the per-item
 * data bag is *not* wrapped in a shallow `$watch` Proxy. Without that Proxy,
 * a write such as `t_old_item.data.row = newRow` doesn't propagate through a
 * signal, so any effects that read `data.row` must be re-run manually.
 *
 * Equivalent to what `checkEffect` does when a signal has propagated, but
 * unconditional: cleanup → deactivate sources → run → clear unused sources,
 * for every effect on the region and on every descendant region
 * (`depth > region.depth`, the same chain shape `clearRegion` walks).
 */
export default function rerunRegionEffects(region: Region): void {
	rerunEffectsOnRegion(region);
	let child: Region | null = region.nextRegion;
	while (child !== null && child.depth > region.depth) {
		rerunEffectsOnRegion(child);
		child = child.nextRegion;
	}
}

function rerunEffectsOnRegion(region: Region): void {
	for (let effect of region.effects) {
		runCleanups(effect);
		deactivateSources(effect);
		runEffect(effect);
		clearSources(effect);
	}
}
