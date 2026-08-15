import context from "./context";

/**
 * Restores the hydration cursor to a previously-snapshotted node. Used by
 * `@try`/`@catch`: if the try branch throws partway through its hydration
 * walk, the catch branch must resume hydrating from where the try group
 * started, not from wherever the failed branch left the cursor.
 *
 * The cursor is set unconditionally: a failed try-branch build can walk the
 * cursor past the last node (setting it to `null` via `nodeNext`), and the
 * rewind must still restore it — otherwise the catch branch would think it
 * isn't hydrating and insert fresh nodes alongside the server's. When not
 * hydrating at all, the snapshot itself is `null`, so this is a no-op.
 *
 * @param node The snapshotted cursor node (from `saveHydration`).
 */
export default function restoreHydration(node: ChildNode | null): void {
	context.hydrationNode = node;
}
