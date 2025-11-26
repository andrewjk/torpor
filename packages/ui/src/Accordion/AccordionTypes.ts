export const AccordionContextName: unique symbol = Symbol.for("torp.Accordion");
export const AccordionItemContextName: unique symbol = Symbol.for("torp.AccordionItem");

export interface AccordionContext {
	/** Called from an AccordionItem when it is added */
	registerItem: (state: ItemState, setFocused: () => void) => void;
	/** Called from an AccordionItem when it is removed */
	removeItem: (index: number) => void;
	/** Called from an AccordionItem when it is toggled */
	toggleItem: (value: any) => void;
	/** Called from an AccordionHeader when it receives a keyboard event */
	handleHeaderKey: (index: number, e: KeyboardEvent) => void;
}

export interface AccordionItemContext {
	/** Raised when an AccordionItem is toggled */
	toggleItem: (value: any) => void;
	/** Raised when an AccordionHeader receives a keyboard event */
	handleHeaderKey: (index: number, e: KeyboardEvent) => void;
	/** The reactive state for an AccordionItem */
	state: ItemState;
	/** Called in an AccordionItem when its header needs to be focused */
	setHeaderFocused?: () => void;
}

export interface ItemState {
	index: number;
	value: any;
	expanded: boolean;
	headerId: string;
	contentId: string;
	disabled: boolean;
	parentDisabled: boolean;
	/** Called in the Accordion when a header needs to be focused */
	setFocused: () => void;
}
