import type Effect from "../types/Effect";
import type LoadingBoundary from "../types/LoadingBoundary";
import type Region from "../types/Region";
import { COMPUTED_TYPE } from "../types/constants";
import $run from "../watch/$run";
import context from "./context";
import newRegion from "./newRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";
import runControlBranch from "./runControlBranch";

/**
 * Returns true if any source of the effect is a suspended `Computed`
 * (`didSuspend === true`). Used on subsequent runs to detect whether the
 * suspend state has changed without re-rendering content.
 */
function anySourceSuspended(effect: Effect): boolean {
	for (let sub = effect.firstSource; sub !== null; sub = sub.nextSource) {
		const source = sub.source as any;
		if (source.type === COMPUTED_TYPE && source.didSuspend === true) {
			return true;
		}
	}
	return false;
}

/**
 * Renders an `@loading` boundary. On the first run, content is rendered
 * speculatively; if any read inside suspends (`didSuspend`), the boundary
 * discards the partial render and shows the fallback branch instead. On
 * subsequent runs, the effect checks its own source chain for suspended
 * computeds — only switching branches when the suspend state actually
 * changes, leaving fine-grained child effects to handle value updates.
 *
 * @param renderContent Builds the content children (may read $await getters).
 * @param renderFallback Builds the fallback children, or null for empty.
 */
export default function runLoading(
	region: Region,
	anchor: Node | null,
	renderContent: (anchor: Node | null) => void,
	renderFallback: ((anchor: Node | null) => void) | null,
	name?: string,
): void {
	const boundary: LoadingBoundary = { suspended: false, effect: null };
	let index = -1; // -1 = initial, 0 = content, 1 = fallback
	let first = true;
	let theEffect: Effect | null = null;

	const gen = (region.generation = (region.generation ?? 0) + 1);

	$run(function runLoading() {
		if (region.generation !== gen) return;

		// On the first call, $run hasn't returned yet so theEffect is null.
		// runEffect sets context.activeTarget to this effect before calling
		// run(), so capture it here for both suspendRead's subscription and
		// anySourceSuspended's source walk.
		theEffect = context.activeTarget as Effect;
		boundary.effect = theEffect;

		const oldRegion = pushRegion(region, first);
		first = false;

		// Render a branch into a fresh child region, clearing the old branch
		const renderBranch = (targetIndex: number, fn: (anchor: Node | null) => void) => {
			runControlBranch(region, index, targetIndex);
			// runControlBranch may have cleared the previous branch, leaving
			// context.previousRegion pointing at a released region. Reset it
			// to the loading region so the new branch links correctly.
			context.previousRegion = region;
			const branchRegion = newRegion(targetIndex === 0 ? "loading_content" : "loading_fallback");
			const oldR = pushRegion(branchRegion, true);
			fn(anchor);
			popRegion(oldR);
			index = targetIndex;
		};

		// Render content with boundary context active; if it suspends and a
		// fallback exists, immediately switch to fallback
		const attemptContent = () => {
			const oldBoundary = context.loadingBoundary;
			context.loadingBoundary = boundary;
			boundary.suspended = false;

			// During hydration, the server rendered fallback (not content).
			// Temporarily disable hydration so the speculative content render
			// creates fresh nodes instead of reusing the server's fallback
			// nodes (which would be destroyed when content is cleared on
			// suspend, leaving nothing for fallback to hydrate against).
			const savedHydration = context.hydrationNode;
			if (savedHydration !== null) {
				context.hydrationNode = null;
			}

			renderBranch(0, renderContent);

			if (savedHydration !== null) {
				context.hydrationNode = savedHydration;
			}

			context.loadingBoundary = oldBoundary;

			if (boundary.suspended && renderFallback !== null) {
				renderBranch(1, renderFallback);
			}
		};

		if (theEffect === null) {
			// First run (theEffect is assigned after $run returns): render
			// content speculatively to detect suspend
			attemptContent();
		} else {
			// Subsequent run: check source chain for suspend state without
			// re-rendering. Only switch branches when suspend state changed.
			const suspended = anySourceSuspended(theEffect);
			const targetIndex = suspended ? 1 : 0;

			if (targetIndex !== index) {
				if (targetIndex === 0) {
					// Switching to content — render and check for re-suspend
					attemptContent();
				} else if (renderFallback !== null) {
					renderBranch(1, renderFallback);
				} else {
					runControlBranch(region, index, 1);
					index = 1;
				}
			}
		}

		popRegion(oldRegion);
	}, name);
}
