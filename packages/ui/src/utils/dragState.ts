import { $watch } from "@torpor/view";

/**
 * Shared state for HTML5 drag & drop. A source element starts a drag with
 * `beginDrag`; drop targets consult `dragState.current` during dragover and
 * drop. Because the dataTransfer API restricts what can be read outside
 * drop, the store is the reliable channel -- the dataTransfer only carries
 * the drag's id, which doubles as an integrity check and makes drags
 * interoperable across windows when the type is allowed through.
 *
 * Drags don't nest, so a single module-level state is enough.
 */

export interface DragInfo {
	/** Generated identifier for this drag, mirrored into the dataTransfer */
	id: string;
	/** High-level kind ("list-item", "tree-item", "file"...), for filtering */
	kind: string;
	/** Arbitrary payload attached by the drag source */
	data: any;
}

export interface DragState {
	/** The active drag, if any */
	current: DragInfo | undefined;
}

export const dragState: DragState = $watch({
	current: undefined as DragInfo | undefined,
});

let nextId = 0;

/** Starts tracking a drag and returns its id */
export function beginDrag(kind: string, data: any): DragInfo {
	const info: DragInfo = {
		id: String(nextId++),
		kind,
		data,
	};
	dragState.current = info;
	return info;
}

/** Clears the tracked drag */
export function endDrag(): void {
	dragState.current = undefined;
}

const TYPE_PREFIX = "application/x-torpor-drag/";

/** Encodes a drag id into a dataTransfer-compatible mime type */
export function encodeDragType(id: string): string {
	return TYPE_PREFIX + id;
}

/**
 * Writes the drag's id into the event's dataTransfer. No-op when the event
 * carries no transfer (some synthetic tests construct bare events).
 */
export function writeDragType(e: DragEvent, id: string): void {
	e.dataTransfer?.setData(encodeDragType(id), id);
}

/**
 * Resolves which drag an incoming event refers to. Prefers the id encoded
 * in the dataTransfer (verified against the live drag); falls back to the
 * tracked drag itself for dragover events, whose transfers are locked.
 */
export function resolveDrag(e: DragEvent): DragInfo | undefined {
	const current = dragState.current;
	if (!current) return undefined;

	try {
		const types: readonly string[] = e.dataTransfer?.types ?? [];
		for (let type of types) {
			if (type.startsWith(TYPE_PREFIX)) {
				return type === encodeDragType(current.id) ? current : undefined;
			}
		}
	} catch {
		// Reading types can throw for foreign-origin drags; treat those as
		// unmatched and fall back to the tracked drag below
	}
	return current;
}
