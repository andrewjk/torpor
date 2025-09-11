export const MenuBarContextName = "MenuBar";
export const MenuBarItemContextName = "MenuBarItem";

export interface MenuBarContext {
	/** Called from a MenuBarItem when it is shown, to hide others */
	handleItemShow: (index: number) => void;

	/** Called from a MenuBarButton when its button is focused */
	handleButtonFocus: (index: number) => void;

	/** Called from a MenuBarButton when a key is pressed */
	handleButtonKey: (e: KeyboardEvent) => void;

	/** Called from each MenuBarButton to register itself with this MenuBar */
	registerItem: (setVisible: (value: boolean) => void, setFocused: () => void) => { index: number };

	state: {
		/** Whether a menubar item is showing its content. If so, changing to another item should show its content */
		active: boolean;
	};
}

export interface MenuBarItemContext {
	setVisible: (value: boolean) => void;
	state: {
		visible: boolean;
	};
	index: number;
	anchorElement?: HTMLElement;
	focusFirstElement?: () => void;
}

export interface ItemState {
	setVisible: (value: boolean) => void;
	setFocused: () => void;
}
