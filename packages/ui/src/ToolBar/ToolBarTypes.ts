import type { SubmenuItemState } from "../utils/PopoutTypes";

export const ToolBarContextName: unique symbol = Symbol.for("torp.ToolBar");
export const ToolBarGroupContextName: unique symbol = Symbol.for("torp.ToolBarGroup");

export interface ToolBarContext {
	/** Called from a ToolBarLink or ToolBarButton when its button is focused */
	handleItemFocus: (index: number) => void;

	/** Called from a ToolBarLink or ToolBarButton when a key is pressed */
	handleItemKey: (e: KeyboardEvent) => void;

	/** Called from a MenuButton when a submenu is shown */
	handlePopout: (index: number) => void;

	/** Called from each ToolBarLink or ToolBarButton to register itself with this ToolBar */
	registerItem: (item: ItemState) => { index: number };

	orientation: "horizontal" | "vertical";
}

export interface ToolBarGroupContext {
	state: {
		headerId: string;
	};
}

export type ItemState = SubmenuItemState;
