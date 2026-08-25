export const PopoutContextName: unique symbol = Symbol.for("torp.Popout");

// TODO: Use this type in more places
export type HandleButtonPress = (type: "confirm" | "cancel" | undefined, value?: any) => void;

/**
 * The shared focus API for popout-style contexts: content can focus its
 * first/last item after being shown.
 *
 * HACK: Deferring the focus call is necessary because if we focus the first
 * element e.g. in a Dialog's onMount, it will scroll the page to the focused
 * element and mess up our careful positioning. We need to be able to manually
 * set the order to
 * 1. set visible (so we have an element with content)
 * 2. set position (so the element is in the right place)
 * 3. set focus (for accessibility)
 * There may be a more elegant way to accomplish this!
 */
export interface FocusApi {
	focusFirstElement?: () => void;
	focusLastElement?: () => void;
}

/** The shared context for popout components */
export interface PopoutContext extends FocusApi {
	handleButton: HandleButtonPress;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent | KeyboardEvent) => void;
	state: PopoutState;
	//modal: boolean;
	anchorElement?: HTMLElement;

	/**
	 * Called from menu content when an arrow key should move to an adjacent item
	 * in a containing MenuBar, opening its menu. Only set by MenuBarItem.
	 */
	navigateMenuBar?: (target: "previous" | "next") => void;

	markElement?: (id: string) => void;
	selectMarkedElement?: () => void;
	searchText?: string;
	searchItems?: (searchText: string) => { id: string; setFocused: () => void } | undefined;
}

export interface PopoutState {
	visible: boolean;
	contentId?: string;
	triggerId?: string;
	/**
	 * The role of this popout's content ("menu", "listbox", "tree", "grid" or
	 * "dialog"), set by the content component so that triggers can use it for
	 * their aria-haspopup attribute.
	 */
	contentRole?: string;
	/** Whether the popout is modal (e.g. it has an overlay) */
	modal?: boolean;
	/** The ID of the active descendant element, for aria-activedescendant */
	activeDescendant?: string;
}

/**
 * The state that a submenu trigger registers with its containing group
 * (Menu, MenuBar, ToolBar or NavMenu). Passed to `registerItem`; the group
 * assigns `index`, and the trigger assigns `text` from its label on mount.
 */
export interface SubmenuItemState {
	/** Assigned by the group on registration */
	index?: number;
	/** The item's label, set from its text content on mount; used for type-ahead */
	text?: string;
	setFocused: () => void;
	/** Shows or hides the item's submenu */
	setVisible?: (visible: boolean) => void;
	/** Whether the item is disabled; disabled items are skipped by keyboard navigation */
	disabled?: boolean;
}

export interface Point {
	x: number;
	y: number;
}
