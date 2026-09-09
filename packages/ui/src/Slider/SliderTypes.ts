export const SliderContextName: unique symbol = Symbol.for("torp.Slider");

export interface SliderContext {
	/** The minimum allowed value */
	getMin: () => number;
	/** The maximum allowed value */
	getMax: () => number;
	/** The amount by which the value is increased or decreased */
	getStep: () => number;
	/** The orientation of the slider */
	getOrientation: () => "horizontal" | "vertical";
	/** Whether the user cannot interact with the slider */
	getDisabled: () => boolean;
	/** The current value, clamped to the min and max */
	getValue: () => number;
	/** The percentage of the range that the value represents (0..100) */
	getPct: () => number;
	/** Sets the value, snapped to the step and clamped to the min and max */
	setValue: (value: number) => void;
	/** The accessible name for the slider, from the Slider's ariaLabel */
	getAriaLabel: () => string | undefined;
	/** Called from the handle when it is added */
	registerHandle: (el: HTMLElement) => void;
	/** Called from the handle when it is removed */
	unregisterHandle: (el: HTMLElement) => void;
	/** Whether the slider is contained within a Form Field */
	inField: () => boolean;
	/** Whether the slider's value is currently valid */
	valid: () => boolean;
	/** The ID of the Field's Message component, for aria-describedby */
	messageId: () => string | undefined;
	/** Called when the handle loses focus */
	handleBlur: () => void;
}
