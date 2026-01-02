export const PopoutContextName: unique symbol = Symbol.for("torp.Popout");

// TODO: Use this type in more places
export type HandleButtonPress = (type: "confirm" | "cancel" | undefined, value?: any) => void;

/** The shared context for popout components */
export interface PopoutContext {
	handleButton: HandleButtonPress;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	state: PopoutState;
	//modal: boolean;
	anchorElement?: HTMLElement;
	// HACK: focusFirstElement is necessary because if we focus the first element e.g. in a Dialog's
	// onMount, it will scroll the page to the focused element and mess up our careful positioning
	// We need to be able to manually set the order to
	// 1. set visible (so we have an element with content)
	// 2. set position (so the element is in the right place)
	// 3. set focus (for accessibility)
	// There may be a more elegant way to accomplish this!
	focusFirstElement?: () => void;
	focusLastElement?: () => void;
	markElement?: (id: string) => void;
	selectMarkedElement?: () => void;
	searchText?: string;
	searchItems?: (searchText: string) => { setFocused: () => void } | undefined;
}

export interface PopoutState {
	visible: boolean;
	//position: Point;
	contentId?: string;
}

export interface Point {
	x: number;
	y: number;
}
