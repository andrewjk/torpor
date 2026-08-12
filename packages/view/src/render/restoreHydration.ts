import context from "./context";

/**
 * Restores the hydration cursor to a previously-snapshotted node. Used by
 * `@try`/`@catch`: if the try branch throws partway through its hydration
 * walk, the catch branch must resume hydrating from where the try group
 * started, not from wherever the failed branch left the cursor.
 *
 * @param node The snapshotted cursor node (from `saveHydration`).
 */
export default function restoreHydration(node: ChildNode | null): void {
	if (context.hydrationNode !== null) {
		context.hydrationNode = node;
	}
}
