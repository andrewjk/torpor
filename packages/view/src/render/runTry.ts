import type Effect from "../types/Effect";
import type ErrorBoundary from "../types/ErrorBoundary";
import type Region from "../types/Region";
import $run from "../watch/$run";
import trackSignal from "../watch/trackSignal";
import context from "./context";
import newRegion from "./newRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";
import restoreHydration from "./restoreHydration";
import runControlBranch from "./runControlBranch";
import saveHydration from "./saveHydration";
import widenAncestorsAtAnchor from "./widenAncestorsAtAnchor";

/**
 * Renders a `@try`/`@catch` group, or a top-level `@error` block (which the
 * compiler wraps around the whole render).
 *
 * Like `runAwait`, the boundary is a control effect that renders one branch
 * at a time into a fresh child region (`runControlBranch` clears the old
 * branch on switch). Unlike the old compiled form, the try/catch lives in
 * this runtime, which gives it three capabilities the compiled form lacked:
 *
 * - **Effect-rerun error routing.** The boundary registers itself on its
 *   region (`region.errorBoundary`); when an effect inside the try content
 *   throws on a later re-run, `triggerEffects` → `routeEffectError` stores
 *   the error here and force re-runs the boundary effect, which renders the
 *   catch branch with it.
 * - **Recovery outside direct reads.** Reactive reads wrapped in nested
 *   `$run` effects (text/attribute interpolation) are tracked by those
 *   effects, not the boundary. When an error is routed, the boundary holds
 *   the erroring effect's source signals (`heldSignals`) and re-subscribes
 *   to them on every run that shows the catch branch, so a later change
 *   re-attempts the try branch.
 * - **Top-level `@error` recovery.** Because the whole render is a
 *   re-runnable branch, a later re-render error (from a nested control
 *   re-running after a prop change) is caught by the same routing, and a
 *   recovery re-render clears the error content and restores the normal
 *   content.
 *
 * Semantics preserved from the compiled form:
 *
 * - Synchronous build errors in the try content render the catch branch
 *   (rewinding the hydration cursor and restoring the control region, which
 *   the failed partial build left active).
 * - While the try branch is showing, a boundary re-run with no routed error
 *   does NOT rebuild it (`runControlBranch` same-index skip) — exactly like
 *   `@if`/`@switch` branches.
 * - While the catch branch is showing, any boundary re-run re-attempts the
 *   try branch (the recovery path for errors read directly by the boundary
 *   effect, e.g. via `@const`).
 * - With no catch branch, errors propagate up to the nearest outer boundary
 *   and no boundary is registered on the region.
 *
 * @param renderTry Builds the try content. May read reactive state.
 * @param renderCatch Builds the catch content, or null for `@try` without
 *   `@catch`. Receives the error (the `@catch (err)` variable).
 */
export default function runTry(
	region: Region,
	anchor: Node | null,
	renderTry: (anchor: Node | null) => void,
	renderCatch: ((anchor: Node | null, error: any) => void) | null,
	name?: string,
): void {
	const boundary: ErrorBoundary = {
		error: undefined,
		hasError: false,
		effect: null,
		heldSignals: null,
	};
	if (renderCatch !== null) {
		region.errorBoundary = boundary;
	}

	let index = -1; // -1 = initial, 0 = try, 1 = catch
	let first = true;

	const gen = (region.generation = (region.generation ?? 0) + 1);

	$run(function runTry() {
		// If this effect was created by a previous runTry call for the same
		// region, it is stale and should not execute
		if (region.generation !== gen) {
			return;
		}

		const theEffect = context.activeTarget as Effect;
		boundary.effect = theEffect;

		const oldRegion = pushRegion(region, first);
		first = false;

		// Render a branch into a fresh child region, clearing the old branch
		const renderBranch = (targetIndex: number, fn: (anchor: Node | null) => void) => {
			runControlBranch(region, index, targetIndex);
			// runControlBranch may have cleared the previous branch, leaving
			// context.previousRegion pointing at a released region. Reset it
			// to the boundary region so the new branch links correctly.
			context.previousRegion = region;
			const branchRegion = newRegion(targetIndex === 0 ? "try" : "catch");
			const oldR = pushRegion(branchRegion, true);
			fn(anchor);
			popRegion(oldR);
			index = targetIndex;
		};

		// (Re-)subscribe the boundary effect to the held signals. Called
		// while the boundary effect is the active target, so the
		// subscriptions are active and survive `clearSources`
		const holdSignals = () => {
			if (boundary.heldSignals === null || theEffect === null) return;
			for (const signal of boundary.heldSignals) {
				trackSignal(signal);
			}
		};

		// An effect error routed from triggerEffects renders the catch branch
		// via the stored boundary error
		const hasRoutedError = boundary.hasError;
		const routedError = boundary.error;
		boundary.hasError = false;

		if (hasRoutedError && renderCatch !== null) {
			// Force a re-render of the catch branch (the try branch's content
			// — including the erroring effect — is cleared by the branch
			// switch), then hold the routed signals for recovery
			index = -1;
			renderBranch(1, (a) => renderCatch(a, routedError));
			holdSignals();
		} else if (index !== 0) {
			// First run, or the catch branch is showing and a dependency
			// changed: (re-)attempt the try content
			const snapshot = saveHydration();
			try {
				renderBranch(0, renderTry);
				// The try attempt succeeded: stop holding routed signals (the
				// attempt's own reads now drive future re-runs)
				boundary.heldSignals = null;
			} catch (err) {
				// The failed attempt left its branch region active/stale and
				// may have advanced the hydration cursor. Restore the control
				// region and rewind the cursor before rendering the catch
				// branch (the branch switch below clears the partial try
				// content)
				pushRegion(region);
				restoreHydration(snapshot);
				if (renderCatch !== null) {
					index = -1;
					renderBranch(1, (a) => renderCatch(a, err));
					holdSignals();
				} else {
					// No catch branch: propagate to the nearest outer boundary
					throw err;
				}
			}
		}

		popRegion(oldRegion);

		// A later re-run may have rendered content before our anchor that an
		// ancestor's node window doesn't cover — widen those windows so
		// clearing the ancestor can't orphan the content (see
		// widenAncestorsAtAnchor).
		widenAncestorsAtAnchor(region, anchor);

		// While hydrating, reset the cursor to the boundary's anchor after
		// its content has been hydrated (see runControl)
		if (context.hydrationNode !== null && anchor !== null) {
			context.hydrationNode = anchor as ChildNode;
		}
	}, name);
}
