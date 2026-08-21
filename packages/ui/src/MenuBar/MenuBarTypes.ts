import { type FocusApi } from "../utils/PopoutTypes";

export const MenuBarContextName: unique symbol = Symbol.for("torp.MenuBar");
export const MenuBarItemContextName: unique symbol = Symbol.for("torp.MenuBarItem");

export interface MenuBarContext {
	/** Called from a MenuBarItem when it is shown, to hide others */
	handleItemShow: (index: number) => void;

	/** Called from a MenuBarButton when its button is focused */
	handleButtonFocus: (index: number) => void;

	/** Called from a MenuBarButton when a key is pressed */
	handleButtonKey: (e: KeyboardEvent) => void;

	/** Called from each MenuBarButton to register itself with this MenuBar */
	registerItem: (item: ItemState) => { index: number };

	state: {
		/** Whether a menubar item is showing its content. If so, changing to another item should show its content */
		active: boolean;
	};
}

export interface MenuBarItemContext extends FocusApi {
	setVisible: (value: boolean) => void;
	state: {
		visible: boolean;
		/** The role of this item's popout content, used by the trigger for aria-haspopup */
		contentRole?: string;
	};
	index: number;
	anchorElement?: HTMLElement;
}

export interface ItemState {
	setVisible: (value: boolean) => void;
	setFocused: () => void;
	/** Whether the item is disabled; disabled items are skipped by keyboard navigation */
	disabled?: boolean;
}
