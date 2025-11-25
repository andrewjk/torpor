export const DisclosureContextName: unique symbol = Symbol.for("torp.Disclosure");

export interface DisclosureContext {
	/** The reactive state for a Disclosure */
	state: DisclosureState;
}

export interface DisclosureState {
	headerId: string;
	contentId: string;
	expanded: boolean;
	disabled: boolean;
}
