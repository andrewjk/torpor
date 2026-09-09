export const TimePickerContextName: unique symbol = Symbol.for("torp.TimePicker");

/** One of the spinbutton segments of a TimePicker */
export type Part = "hour" | "minute" | "second";

export interface TimePickerContext {
	/** Whether the user cannot interact with the time picker */
	getDisabled: () => boolean;
	/** The accessible name for a segment */
	getPartLabel: (part: Part) => string;
	/** A segment's value, for aria-valuenow */
	getPartValue: (part: Part) => number;
	/** A segment's value as announced, for aria-valuetext */
	getPartText: (part: Part) => string;
	/** The text displayed in a segment */
	partDisplay: (part: Part) => string;
	/** Handles typing in a segment */
	handleInput: (part: Part, e: Event) => void;
	/** Handles a segment losing focus */
	handleBlur: (part: Part, e: FocusEvent) => void;
	/** Handles arrow/Home/End/Enter keys in a segment */
	handleSegmentKey: (part: Part, e: KeyboardEvent) => void;
	/** Called from a segment when it is added */
	registerPart: (part: Part, el: HTMLInputElement) => void;
	/** Called from a segment when it is removed */
	unregisterPart: (part: Part, el: HTMLInputElement) => void;
	/** Whether the current time is in the PM half of the day */
	isPM: () => boolean;
	/** Toggles between AM and PM */
	togglePeriod: () => void;
	/** Handles arrow keys on the period toggle */
	handlePeriodKey: (e: KeyboardEvent) => void;
	/** Called from the period toggle when it is added */
	registerPeriod: (el: HTMLButtonElement) => void;
	/** Called from the period toggle when it is removed */
	unregisterPeriod: (el: HTMLButtonElement) => void;
}
