import { type PopoutState, type SubmenuItemState } from "../utils/PopoutTypes";

export const MenuBarContextName: unique symbol = Symbol.for("torp.MenuBar");
export const MenuBarItemContextName: unique symbol = Symbol.for("torp.MenuBarItem");

export interface MenuBarContext {
	/** Called from a MenuBarItem when it is shown, to hide others */
	handleItemShow: (index: number) => void;

	/** Called from a MenuBarButton when its button is focused */
	handleButtonFocus: (index: number) => void;

	/** Called from a MenuBarButton when a key is pressed */
	handleButtonKey: (e: KeyboardEvent) => void;

	/**
	 * Called from a MenuBarItem when a contained menu signals that focus should
	 * move to an adjacent item, opening its menu
	 */
	handleAdjacentItem: (index: number, target: "previous" | "next") => void;

	/** Called from each MenuBarButton to register itself with this MenuBar */
	registerItem: (item: ItemState) => { index: number };

	state: {
		/** Whether a menubar item is showing its content. If so, changing to another item should show its content */
		active: boolean;
	};
}

export interface MenuBarItemContext {
	setVisible: (value: boolean) => void;
	state: PopoutState;
	index: number;
}

export type ItemState = SubmenuItemState;
