export const ToolBarContextName: unique symbol = Symbol.for("torp.ToolBar");
export const ToolBarPopoutContextName: unique symbol = Symbol.for("torp.ToolBarPopout");
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

export interface ItemState {
	/** Assigned by the ToolBar on registration */
	index?: number;
	setFocused: () => void;
	setVisible?: (visible: boolean) => void;
	/** Whether the item is disabled; disabled items are skipped by keyboard navigation */
	disabled?: boolean;
}
