export const ColorPickerContextName: unique symbol = Symbol.for("torp.ColorPicker");

export interface ColorPickerContext {
	/** Whether the user cannot interact with the picker */
	getDisabled: () => boolean;
	/** The selected color as "#rrggbb"; undefined if nothing is selected */
	getValue: () => string | undefined;
	/** An accessible name for the picker */
	getAriaLabel: () => string | undefined;
	/** Commits a hex input value, reporting it when it changes the value */
	commitValue: (value: string | undefined) => void;
}
