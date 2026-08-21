export const NavMenuContextName: unique symbol = Symbol.for("torp.NavMenu");
export const NavMenuPopoutContextName: unique symbol = Symbol.for("torp.NavMenuPopout");
export const NavMenuGroupContextName: unique symbol = Symbol.for("torp.NavMenuGroup");

export interface NavMenuContext {
	/** Called from a NavMenuLink or NavMenuButton when its button is focused */
	handleItemFocus: (index: number) => void;

	/** Called from a NavMenuLink or NavMenuButton when a key is pressed */
	handleItemKey: (e: KeyboardEvent) => void;

	/** Called from each NavMenuLink or NavMenuButton to register itself with this NavMenu */
	registerItem: (item: ItemState) => { index: number };
}

export interface NavMenuPopoutContext {
	state: {
		visible: boolean;
		/** The ID of the popout content, for use with aria-controls */
		contentId?: string;
		/** The ID of the popout trigger, for use with aria-labelledby */
		triggerId?: string;
	};
	anchorElement?: HTMLElement;
	focusFirstElement?: () => void;
	focusLastElement?: () => void;
}

export interface NavMenuGroupContext {
	state: {
		headerId: string;
	};
}

export interface ItemState {
	setFocused: () => void;
	/** Whether the item is disabled; disabled items are skipped by keyboard navigation */
	disabled?: boolean;
}
