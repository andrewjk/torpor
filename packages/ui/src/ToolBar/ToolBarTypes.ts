export const ToolBarContextName = "ToolBar";
export const ToolBarPopoutContextName = "ToolBarPopout";
export const ToolBarGroupContextName = "ToolBarGroup";

export interface ToolBarContext {
	/** Called from a ToolBarLink or ToolBarButton when its button is focused */
	handleItemFocus: (index: number) => void;

	/** Called from a ToolBarLink or ToolBarButton when a key is pressed */
	handleItemKey: (e: KeyboardEvent) => void;

	/** Called from each ToolBarLink or ToolBarButton to register itself with this ToolBar */
	registerItem: (setFocused: () => void) => { index: number };

	orientation: "horizontal" | "vertical";
}

export interface ToolBarPopoutContext {
	state: {
		visible: boolean;
	};
	anchorElement?: HTMLElement;
	focusFirstElement?: () => void;
}

export interface ToolBarGroupContext {
	state: {
		headerId: string;
	};
}

export interface ItemState {
	setFocused: () => void;
}
