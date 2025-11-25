export const PaginationContextName = "Pagination";

export interface PaginationContext {
	// The registerItem function is called from each SeriesItem to register itself and its
	// methods with this component
	registerItem: (
		target: PageNumber,
		setActive: (value: boolean) => void,
		setFocused: () => void,
	) => void;
	// The removeItem function is called from a SeriesItem when it has been unloaded so that we
	// can remove it from the itemStates array
	removeItem: (target: PageNumber) => void;
	toggleItem: (target: PageNumber) => void;
	handleItemKey: (e: KeyboardEvent) => void;
}

export interface ItemState {
	target: PageNumber;
	active: boolean;
	setActive: (value: boolean) => void;
	setFocused: () => void;
}

export type PageNumber = "start" | "startgap" | "previous" | "next" | "end" | "endgap" | number;
