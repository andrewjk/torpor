export const DrawerContextName = "Drawer";

/** The shared context for drawer components (Contextual, Prompt and Drawer) */
export interface DrawerContext {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	state: DrawerState;
	// HACK: focusFirstElement is necessary because if we focus the first element e.g. in a Dialog's
	// onMount, it will scroll the page to the focused element and mess up our careful positioning
	// We need to be able to manually set the order to
	// 1. set visible (so we have an element with content)
	// 2. set position (so the element is in the right place)
	// 3. set focus (for accessibility)
	// There may be a more elegant way to accomplish this!
	focusFirstElement?: () => void;
}

export interface DrawerState {
	visible: boolean;
	modal: boolean;
	position: "left" | "right" | "top" | "bottom";
}
