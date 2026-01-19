export const MenuContextName: unique symbol = Symbol.for("torp.Menu");
export const MenuButtonContextName: unique symbol = Symbol.for("torp.MenuButton");
export const MenuRadioGroupContextName: unique symbol = Symbol.for("torp.MenuRadioGroup");

export interface MenuContext {
	/** Called from a MenuButton to close the Menu and return a result */
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;

	/** Called from a MenuButton when its button is focused */
	handleItemFocus: (index: number) => void;

	/** Called from a MenuButton when a key is pressed */
	handleItemKey: (e: KeyboardEvent) => void;

	/** Called from a MenuButton when a submenu is shown */
	handlePopout: (index: number) => void;

	state: MenuState;

	/** The element that caused this Menu to be shown */
	anchorElement?: HTMLElement;

	/** Called from each MenuButton/Check/Radio to register itself with this Menu */
	registerItem: (
		setFocused: () => void,
		setVisible?: (visible: boolean) => void,
	) => { index: number };
}

export interface MenuState {
	/** Whether the Menu is visible */
	visible: boolean;
}

export interface MenuButtonContext {
	state: {
		checked: boolean;
	};
}

export interface MenuRadioGroupContext {
	registerItemInGroup: (itemState: RadioGroupItemState) => void;
	toggleItem: (value: string) => void;
}

export interface ItemState {
	index: number;
	setFocused: () => void;
	setVisible?: (visible: boolean) => void;
}

export interface RadioGroupItemState {
	value: string;
	checked: boolean;
}
