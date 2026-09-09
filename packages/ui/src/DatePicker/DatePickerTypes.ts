export const DatePickerContextName: unique symbol = Symbol.for("torp.DatePicker");

export interface DatePickerContext {
	/** Whether the user cannot interact with the date picker */
	getDisabled: () => boolean;
	/** The ID of the trigger, for the content's aria-labelledby */
	getTriggerId: () => string;
	/** The ID of the content, for the trigger's aria-controls */
	getContentId: () => string;
	/** Whether the popout is visible */
	isVisible: () => boolean;
	/** Toggles the popout */
	toggle: () => void;
	/** The text displayed in the trigger */
	getDisplayText: () => string;
	/** An accessible name for the trigger */
	getAriaLabel: () => string | undefined;
	/** Whether the picker is contained within a Form Field */
	inField: () => boolean;
	/** Whether the picker's value is currently valid */
	valid: () => boolean;
	/** The ID of the Field's Message component, for aria-describedby */
	messageId: () => string | undefined;
	/** Called when the trigger loses focus */
	handleBlur: () => void;
	/** The selected date */
	getValue: () => Date | undefined;
	/** Selects a date, closing the popout */
	selectDate: (date: Date) => void;
	/** Closes the popout, returning focus to the trigger */
	close: () => void;
	/** Called from the content when it is added */
	registerContent: (el: HTMLDivElement) => void;
	/** Called from the content when it is removed */
	unregisterContent: (el: HTMLDivElement) => void;
}
