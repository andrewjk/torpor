export const PaginationContextName: unique symbol = Symbol.for("torp.Pagination");

export interface PaginationContext {
	// The registerItem function is called from each SeriesItem to register itself and its
	// state with this component
	registerItem: (item: ItemState) => void;
	// The removeItem function is called from a SeriesItem when it has been unloaded so that we
	// can remove it from the itemStates array
	removeItem: (target: PageNumber) => void;
	toggleItem: (target: PageNumber) => void;
	handleItemKey: (e: KeyboardEvent) => void;
	jumpToPage: (page: number) => void;
}

export interface ItemState {
	target: PageNumber;
	active: boolean;
	setActive: (value: boolean) => void;
	setFocused: () => void;
}

export type PageNumber = "start" | "startgap" | "previous" | "next" | "end" | "endgap" | number;
