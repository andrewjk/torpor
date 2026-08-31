import type Region from "../types/Region";
import clearSources from "../watch/clearSources";
import deactivateSources from "../watch/deactivateSources";
import runCleanups from "../watch/runCleanups";
import runEffect from "../watch/runEffect";

/**
 * Force re-runs every effect owned by `region` and its descendant regions
 * that depends on at least one of the for-vars set in `changedMask`.
 *
 * Used by keyed-list `updateListItem` callbacks emitted by the compiler when
 * the `@for` body has been classified "no-proxy safe" — i.e. the per-item
 * data bag is *not* wrapped in a shallow `$watch` Proxy. Without that Proxy,
 * a write such as `t_old_item.data.row = newRow` doesn't propagate through a
 * signal, so any effects that read `data.row` must be re-run manually.
 *
 * `changedMask` is a bitmask of the for-var positions whose references
 * actually changed in this update. Each effect carries `forVarMask`
 * (computed at compile time) listing the for-vars its body reads; effects
 * whose `forVarMask & changedMask === 0` are skipped. Mount callbacks
 * (`isMountEffect` — `$onmount`/`onmount`) are always skipped: they run
 * once per DOM mount and their bodies are untracked.
 *
 * Equivalent to what `checkEffect` does when a signal has propagated, but
 * unconditional for the effects that do match: cleanup → deactivate sources
 * → run → clear unused sources, for every matching effect on the region and
 * on every descendant region (`depth > region.depth`, the same chain shape
 * `clearRegion` walks).
 */
export default function rerunRegionEffects(region: Region, changedMask: number): void {
	rerunEffectsOnRegion(region, changedMask);
	let child: Region | null = region.nextRegion;
	while (child !== null && child.depth > region.depth) {
		rerunEffectsOnRegion(child, changedMask);
		child = child.nextRegion;
	}
}

function rerunEffectsOnRegion(region: Region, changedMask: number): void {
	for (let effect of region.effects) {
		// Mount callbacks run once per region mount (their `$onmount`/`onmount`
		// semantics) and are untracked, so re-running them here would fire
		// `onmount` again on every keyed-list item update even when the DOM node
		// is reused.
		if (effect.isMountEffect) continue;
		// When `forVarMask` is set (effect emitted inside a no-proxy `@for`
		// body), skip effects that don't read any of the changed for-vars.
		// `0` means the effect reads no for-vars at all — always skip.
		// `undefined` means no dependency info — re-run unconditionally.
		if (effect.forVarMask !== undefined && (effect.forVarMask & changedMask) === 0) continue;
		runCleanups(effect);
		deactivateSources(effect);
		runEffect(effect);
		clearSources(effect);
	}
}
