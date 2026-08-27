import { type DragInfo, resolveDrag } from "../utils/dragState";

interface DropTargetOptions {
	/** Filters incoming drags; only accepted kinds receive over/drop calls */
	accepts?: (info: DragInfo) => boolean;
	/** The cursor effect shown while hovering (default "move") */
	effect?: "move" | "copy" | "link";
	/** Called continuously while an accepted drag hovers the target */
	onover?: (info: DragInfo, e: DragEvent) => void;
	/** Called once when hovering starts */
	onenter?: (info: DragInfo, e: DragEvent) => void;
	/** Called once when hovering ends */
	onleave?: () => void;
	/** Called when an accepted drag is dropped; returning false rejects it */
	ondrop?: (info: DragInfo, e: DragEvent) => boolean | void;
	/** Class applied while an accepted drag hovers the target */
	dragClass?: string;
}

/**
 * Turns an element into a drop target for native HTML5 drags.
 *
 * ```
 * <div
 * 	class="panel"
 * 	onmount={(el) =>
 * 		dropTarget(el, {
 * 			accepts: (info) => info.kind === "list-item",
 * 			dragClass: "dropping",
 * 			ondrop: (info) => addItem(info.data),
 * 		})
 * 	}
 * />
 * ```
 *
 * Handles the tedious parts of the platform API -- preventing the browser's
 * default navigation, resolving the tracked drag, effect negotiation --
 * so components only express what they accept and what happens on drop.
 */
export default function dropTarget(node: HTMLElement, options: DropTargetOptions): () => void {
	let hoverClassApplied = false;

	function accepts(info: DragInfo | undefined): info is DragInfo {
		return !!info && (!options.accepts || options.accepts(info));
	}

	function applyHover() {
		if (!hoverClassApplied && options.dragClass) {
			hoverClassApplied = true;
			node.classList.add(options.dragClass);
		}
	}

	function removeHover() {
		if (hoverClassApplied) {
			hoverClassApplied = false;
			node.classList.remove(options.dragClass!);
		}
	}

	function handleOver(e: DragEvent) {
		const info = resolveDrag(e);
		if (!accepts(info)) return;

		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = options.effect ?? "move";
		}
		applyHover();
		options.onover?.(info!, e);
	}

	function handleEnter(e: DragEvent) {
		const info = resolveDrag(e);
		if (!accepts(info)) return;
		applyHover();
		options.onenter?.(info!, e);
	}

	function handleLeave(e: DragEvent) {
		const related = e.relatedTarget as Node | null;
		if (related && node.contains(related)) return;
		removeHover();
		options.onleave?.();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		removeHover();

		const info = resolveDrag(e);
		if (!accepts(info)) return;
		options.ondrop?.(info!, e);
	}

	node.addEventListener("dragover", handleOver);
	node.addEventListener("dragenter", handleEnter);
	node.addEventListener("dragleave", handleLeave);
	node.addEventListener("drop", handleDrop);

	return () => {
		removeHover();
		node.removeEventListener("dragover", handleOver);
		node.removeEventListener("dragenter", handleEnter);
		node.removeEventListener("dragleave", handleLeave);
		node.removeEventListener("drop", handleDrop);
	};
}
