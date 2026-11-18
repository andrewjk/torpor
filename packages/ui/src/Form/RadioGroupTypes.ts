import type { FocusItemState } from "../utils/focusGroup";

export const RadioGroupContextName: unique symbol = Symbol("RadioGroup");

export interface RadioItemState extends FocusItemState {
	/** The value submitted when this radio is selected */
	value: any;
	/** The element ID of this radio */
	id: string;
}

export interface RadioGroupContext {
	registerItem: (
		index: number | undefined,
		value: any,
		disabled: boolean | undefined,
		id: string,
	) => RadioItemState;
	removeItem: (index: number) => void;
	/** Whether a radio is the selected one */
	isSelected: (item: RadioItemState) => boolean;
	/** Selects a radio, reporting the change */
	select: (item: RadioItemState) => void;
	/** Handles the roving-tabindex arrow keys for a radio */
	handleKey: (index: number, e: KeyboardEvent) => void;
	/** Records that a radio received focus, for the roving tab stop */
	handleItemFocus: (index: number) => void;
	/** Whether the radio should be the group's single tab stop */
	isTabStop: (index: number) => boolean;
	/** The ID of the selected radio, for the Field's Label */
	getSelectedId: () => string | undefined;
	/** Whether the whole group is disabled */
	getDisabled: () => boolean;
	/** The Field's validity, for aria/data attributes */
	getValid: () => boolean;
	/** The Field's message ID, for aria-describedby */
	getMessageId: () => string | undefined;
	/** Whether the group is inside a Form Field */
	inField: () => boolean;
}
