import type Effect from "../types/Effect";
import type AwaitBoundary from "../types/AwaitBoundary";
import type Region from "../types/Region";
import $run from "../watch/$run";
import trackSignal from "../watch/trackSignal";
import context from "./context";
import isCommentNode from "./isCommentNode";
import newRegion from "./newRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";
import runControlBranch from "./runControlBranch";
import widenAncestorsAtAnchor from "./widenAncestorsAtAnchor";

/**
 * Comment prefix marking the embedded `source: "server"` values that the
 * server writes after a resolved boundary's anchor (`<!--t-await:[...]-->`,
 * see ASYNC.md §7.10).
 */
const SERVER_VALUES_PREFIX = "t-await:";

/**
 * Renders an `@await` boundary. On the first run, content is rendered
 * speculatively; if any read inside suspends (`didSuspend`), the boundary
 * discards the partial render and shows the `with` branch instead.
 *
 * Hydration of a server-resolved boundary (ASYNC.md §7.10): when the server
 * shipped resolved content, its values ride in a payload comment after the
 * anchor. The boundary renders the content branch *with* hydration enabled
 * and `$async` seeds its computeds from the payload, so the server's HTML is
 * adopted directly — no speculative render, no `with`-branch dance, no
 * fallback flash.
 *
 * Fine-grained updates: on subsequent runs the boundary only decides whether
 * to SWITCH branches. It does so from its `pending` set — the suspended
 * computeds recorded by `suspendRead` — dropping entries that resolved and
 * re-subscribing the still-suspended ones (a re-run deactivates all of the
 * effect's source subscriptions, so they must be re-tracked to survive
 * `clearSources`). That check is O(pending reads), not O(all sources), and
 * non-suspend dependency changes inside content are left to the child
 * effects that read them — the boundary isn't re-run by them at all.
 *
 * Stale-while-revalidate (ASYNC.md §6.2): once content has been produced
 * (`hasContent`), a subsequent suspend during a refresh does NOT switch to
 * the `with` branch — the boundary keeps the stale content mounted. `$async`
 * retains the previous resolved value (`Computed.staleValue`) and
 * `suspendRead` returns it, so child effects keep displaying the old value
 * until the new promise resolves and updates them in place. The `with` branch
 * is shown only on the first load, before content has ever rendered
 * successfully.
 *
 * @param renderContent Builds the content children (may read $async getters).
 * @param renderWith Builds the `with`-branch children, or null for empty.
 */
export default function runAwait(
	region: Region,
	anchor: Node | null,
	renderContent: (anchor: Node | null) => void,
	renderWith: ((anchor: Node | null) => void) | null,
	name?: string,
): void {
	const boundary: AwaitBoundary = {
		suspended: false,
		pending: new Set(),
		effect: null,
	};
	let index = -1; // -1 = initial, 0 = content, 1 = with
	let first = true;
	let hasContent = false; // true once content has rendered without suspending
	let theEffect: Effect | null = null;

	// Resolved values embedded by the server for this boundary, read once
	// during hydration
	let serverValues: any[] | null = null;
	if (context.hydrationNode !== null && anchor !== null) {
		const next = anchor.nextSibling;
		if (next !== null && isCommentNode(next) && next.data.startsWith(SERVER_VALUES_PREFIX)) {
			try {
				serverValues = JSON.parse(next.data.substring(SERVER_VALUES_PREFIX.length));
			} catch {
				serverValues = null;
			}
			next.remove();
		}
	}

	const gen = (region.generation = (region.generation ?? 0) + 1);

	$run(function runAwait() {
		if (region.generation !== gen) return;

		// On the first call, $run hasn't returned yet so theEffect is null.
		// runEffect sets context.activeTarget to this effect before calling
		// run(), so capture it here for suspendRead's subscription.
		theEffect = context.activeTarget as Effect;
		boundary.effect = theEffect;

		const oldRegion = pushRegion(region, first);
		first = false;

		// Render a branch into a fresh child region, clearing the old branch
		const renderBranch = (targetIndex: number, fn: (anchor: Node | null) => void) => {
			runControlBranch(region, index, targetIndex);
			// runControlBranch may have cleared the previous branch, leaving
			// context.previousRegion pointing at a released region. Reset it
			// to the await region so the new branch links correctly.
			context.previousRegion = region;
			const branchRegion = newRegion(targetIndex === 0 ? "await_content" : "await_with");
			const oldR = pushRegion(branchRegion, true);
			fn(anchor);
			popRegion(oldR);
			index = targetIndex;
		};

		// Render content with boundary context active; if it suspends and a
		// with-branch exists, immediately switch to it
		const attemptContent = () => {
			const oldBoundary = context.awaitBoundary;
			context.awaitBoundary = boundary;
			boundary.suspended = false;

			// During hydration of a server-resolved boundary, the values
			// embedded by the server are made available to `$async` while the
			// content branch renders, and hydration stays enabled so the
			// content adopts the server's nodes directly.
			//
			// Otherwise (a client-fetch boundary), hydration is temporarily
			// disabled: the speculative content render creates fresh nodes
			// instead of reusing the server's with-branch nodes (which would
			// be destroyed when content is cleared on suspend, leaving
			// nothing for the with-branch to hydrate against).
			const savedHydration = context.hydrationNode;
			const savedServerValues = context.serverValues;
			if (serverValues !== null && savedHydration !== null) {
				context.serverValues = { values: serverValues, index: 0 };
			} else if (savedHydration !== null) {
				context.hydrationNode = null;
			}

			renderBranch(0, renderContent);

			context.hydrationNode = savedHydration;
			context.serverValues = savedServerValues;

			context.awaitBoundary = oldBoundary;

			if (boundary.suspended && renderWith !== null) {
				renderBranch(1, renderWith);
			} else if (!boundary.suspended) {
				// Content rendered without suspending — mark it so a later
				// refresh suspend keeps showing stale content (§6.2).
				hasContent = true;
			}
		};

		if (theEffect === null) {
			// First run (theEffect is assigned after $run returns): render
			// content speculatively to detect suspend
			attemptContent();
		} else {
			// Subsequent run: refresh the pending set — resolved computeds
			// drop out, still-suspended ones re-subscribe the boundary effect
			// (checkEffect deactivated every source subscription before this
			// run; without re-tracking, clearSources would detach the
			// boundary from its pending reads and it would never re-run when
			// they resolve). Only switch branches when the suspend state
			// actually changed.
			let suspended = false;
			for (const signal of boundary.pending) {
				if (signal.didSuspend) {
					suspended = true;
					trackSignal(signal);
				} else {
					boundary.pending.delete(signal);
				}
			}
			const targetIndex = suspended ? 1 : 0;

			if (targetIndex !== index) {
				if (targetIndex === 0) {
					// Switching to content — render and check for re-suspend
					attemptContent();
				} else if (!hasContent) {
					// First-load suspend (content never shown): show the
					// with-branch. When hasContent, a refresh suspend keeps
					// the stale content mounted instead of flashing the
					// with-branch — stale-while-revalidate (ASYNC.md §6.2).
					// Child effects read the retained value via $async's
					// staleValue and re-render with the new value when the
					// promise resolves.
					if (renderWith !== null) {
						renderBranch(1, renderWith);
					} else {
						runControlBranch(region, index, 1);
						index = 1;
					}
				}
			}
		}

		popRegion(oldRegion);

		// A later run that switched branches may have rendered content
		// before our anchor that an ancestor's node window doesn't cover —
		// widen those windows so clearing the ancestor can't orphan the
		// content (see widenAncestorsAtAnchor).
		widenAncestorsAtAnchor(region, anchor);
	}, name);
}
