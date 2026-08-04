import type OperationType from "../types/nodes/OperationType";

/**
 * Control operations that produce no DOM output within a fragment.
 *
 * Used by both the fragment builder (to find the first child that actually
 * renders) and the whitespace trimmer (so that whitespace adjacent to these
 * nodes is treated as leading/trailing whitespace of the container, rather
 * than as significant inter-sibling whitespace — without this, every row of
 * a `@for { @key = ...; <tr>...</tr> }` would emit a leading whitespace
 * text node, since the whitespace sits between the @key and the <tr>).
 */
export const NON_RENDERING_OPERATIONS: Set<OperationType> = new Set<OperationType>([
	"@key",
	"@const",
	"@console",
	"@debugger",
	"@function",
	"@async function",
]);
