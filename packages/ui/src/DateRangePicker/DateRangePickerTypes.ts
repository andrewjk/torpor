export const DateRangePickerContextName: unique symbol = Symbol.for("torp.DateRangePicker");

export interface DateRange {
	/** The first date in the range */
	start: Date;
	/** The last date in the range */
	end: Date;
}

export interface DateRangePickerContext {
	/** The first date in the range being selected, as a plain (unwrapped) date */
	getStart: () => Date | undefined;
	/** The last date in the range, once the range is complete, as a plain date */
	getEnd: () => Date | undefined;
	/** The hovered date extending the preview range, as a plain date */
	getPreview: () => Date | undefined;
	/** Whether the user has picked a start date but not an end date yet */
	isSelecting: () => boolean;
	/** Sets the hovered date that extends the range preview */
	setPreview: (date: Date | undefined) => void;
}

export const DateRangePickerShellContextName: unique symbol = Symbol.for(
	"torp.DateRangePickerShell",
);

export interface DateRangePickerShellContext {
	/** Whether the user cannot interact with the date range picker */
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
	/** The start of the range being selected */
	getStartValue: () => Date | undefined;
	/** Whether a day is one of the range's endpoints, for aria-selected */
	isDaySelected: (date: Date) => boolean;
	/** Handles a day being picked, completing the range on the second pick */
	selectDay: (date: Date) => void;
	/** Closes the popout, returning focus to the trigger */
	close: () => void;
	/** Called from the content when it is added */
	registerContent: (el: HTMLDivElement) => void;
	/** Called from the content when it is removed */
	unregisterContent: (el: HTMLDivElement) => void;
}
