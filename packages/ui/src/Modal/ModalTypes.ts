export const ModalContextName = "Modal";

/** The shared context for modal components (Contextual, Prompt and Modal) */
export interface ModalContext {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	state: ModalState;
	// HACK: focusFirstElement is necessary because if we focus the first element e.g. in a Dialog's
	// onMount, it will scroll the page to the focused element and mess up our careful positioning
	// We need to be able to manually set the order to
	// 1. set visible (so we have an element with content)
	// 2. set position (so the element is in the right place)
	// 3. set focus (for accessibility)
	// There may be a more elegant way to accomplish this!
	focusFirstElement?: () => void;
}

export interface ModalState {
	visible: boolean;
}
