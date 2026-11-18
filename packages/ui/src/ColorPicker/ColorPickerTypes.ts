import type { Hsv } from "../utils/colorUtils";

export const ColorPickerContextName: unique symbol = Symbol.for("torp.ColorPicker");

export interface ColorPickerContext {
	/** Whether the user cannot interact with the picker */
	getDisabled: () => boolean;
	/** The selected color as "#rrggbb"; undefined if nothing is selected */
	getValue: () => string | undefined;
	/** An accessible name for the picker */
	getAriaLabel: () => string | undefined;
	/** Commits a parsed color value, reporting it when it changes the value */
	commitValue: (value: string | undefined) => void;
	/** The current color as hue/saturation/value */
	getHsv: () => Hsv;
	/** Commits a hue/saturation/value color, keeping the current alpha */
	commitHsv: (hsv: Hsv, alpha?: number) => void;
	/** The current alpha in [0..1] */
	getAlpha: () => number;
	/** Sets the current alpha, keeping the hue/saturation/value */
	setAlpha: (alpha: number) => void;
}
