import { beginDrag, endDrag, writeDragType } from "../utils/dragState";

interface DraggableOptions {
	/** High-level kind for drop targets to filter on */
	kind?: string;
	/** Payload handed to the drop target that receives this drag */
	data?: any;
	/**
	 * Called when a drag starts; returning false cancels the drag entirely
	 * (useful for drags-in-progress controls, readonly flags etc)
	 */
	onstart?: (e: DragEvent) => boolean | void;
	/** Called when the drag finishes, whether it was dropped or cancelled */
	onend?: (e: DragEvent) => void;
}

/**
 * Makes an element draggable via the native HTML5 drag & drop API.
 *
 * ```
 * <li onmount={(el) => draggable(el, { kind: "list-item", data: item })}>
 * ```
 *
 * Pairs with dropTarget, which receives `{ kind, data }` for accepted
 * drops. The tracked drag is always cleaned up on dragend, so handlers
 * don't leak between drags.
 */
export default function draggable(node: HTMLElement, options: DraggableOptions): () => void {
	let started = false;

	function handleStart(e: DragEvent) {
		if (options.onstart?.(e) === false) {
			e.preventDefault();
			return;
		}
		const info = beginDrag(options.kind ?? "", options.data);
		writeDragType(e, info.id);
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
		}
		started = true;
	}

	function handleEnd(e: DragEvent) {
		if (started) {
			started = false;
			endDrag();
			options.onend?.(e);
		}
	}

	node.addEventListener("dragstart", handleStart);
	node.addEventListener("dragend", handleEnd);

	return () => {
		node.removeEventListener("dragstart", handleStart);
		node.removeEventListener("dragend", handleEnd);
		if (started) {
			started = false;
			endDrag();
		}
	};
}
