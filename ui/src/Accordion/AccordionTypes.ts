export const AccordionContextName = "Accordion";
export const AccordionItemContextName = "AccordionItem";

export interface AccordionContext {
	/** Called from an AccordionItem when it is added */
	registerItem: (
		index: number | undefined,
		value: string | undefined,
		setExpanded: (value: boolean) => void,
		setFocused: () => void,
		setDisabled: (value: boolean) => void,
	) => {
		newIndex: number;
		newValue: string;
	};
	/** Called from an AccordionItem when it is removed */
	removeItem: (index: number) => void;
	/** Called from an AccordionItem when it is toggled */
	toggleItem: (value: string) => void;
	/** Called from an AccordionHeader when it receives a keyboard event */
	handleHeaderKey: (index: number, e: KeyboardEvent) => void;
}

export interface AccordionItemContext {
	/** Called when an AccordionItem is toggled */
	toggleItem: (value: string) => void;
	/** Called when an AccordionHeader receives a keyboard event */
	handleHeaderKey: (index: number, e: KeyboardEvent) => void;
	index: number;
	value: string;
	/** The reactive state for an AccordionItem */
	state: ItemState;
	setHeaderFocused?: () => void;
	disabled: boolean;
}

export interface ItemState {
	index: number;
	value: string;
	expanded: boolean;
	setExpanded: (value: boolean) => void;
	setFocused: () => void;
	setDisabled: (value: boolean) => void;
}
