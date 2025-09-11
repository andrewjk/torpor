export const MenuContextName = "Menu";
export const MenuButtonContextName = "MenuButton";
export const MenuRadioGroupContextName = "MenuRadioGroup";
export const MenuPopoutContextName = "MenuPopout";

export interface MenuContext {
	setVisible: (value: boolean, result?: any) => void;

	/** Called from a MenuButton to close the Menu and return a result */
	handleTrigger: (type: "confirm" | "cancel" | undefined, value?: any) => void;

	/** Called from a MenuButton when its button is focused */
	handleItemFocus: (index: number) => void;

	/** Called from a MenuButton when a key is pressed */
	handleItemKey: (e: KeyboardEvent) => void;

	state: {
		/** Whether the Menu is visible. Writable so that it can be subscribed to by children */
		visible: boolean;
	};

	/** The element that caused this Menu to be shown */
	anchorElement?: HTMLElement;

	/** Called from each MenuButton/Check/Radio to register itself with this Menu */
	registerItem: (setFocused: () => void) => { index: number };
}

export interface MenuButtonContext {
	state: {
		checked: boolean;
	};
}

export interface MenuRadioGroupContext {
	registerItemInGroup: (value: string, setChecked: (value: boolean) => void) => void;
	toggleItem: (value: string) => void;
}

export interface MenuPopoutContext {
	setVisible: (value: boolean) => void;
	state: {
		visible: boolean;
	};
	anchorElement?: HTMLElement;
	focusFirstElement?: () => void;
}

export interface ItemState {
	setFocused: () => void;
}

export interface RadioGroupItemState {
	value: string;
	checked: boolean;
	setChecked: (value: boolean) => void;
}
