export const RatingContextName: unique symbol = Symbol.for("torp.Rating");

export interface RatingContext {
	/** The number of filled stars to display, taking the hovered star into account */
	getDisplayValue: () => number;
	/** Whether the user cannot interact with the rating */
	getDisabled: () => boolean;
	/** Whether the star is the single tab stop (roving tabindex) */
	isTabStop: (value: number) => boolean;
	/** Whether the star matches the current rating */
	isChecked: (value: number) => boolean;
	/** Selects a star, clearing the rating if it is already selected */
	selectValue: (value: number) => void;
	/** Handles arrow/Home/End keys on a star */
	handleKey: (e: KeyboardEvent) => void;
	/** Previews a rating while the pointer hovers a star */
	setHover: (value: number) => void;
	/** Called from a star when it is added */
	registerStar: (value: number, el: HTMLButtonElement | undefined) => void;
	/** Called from a star when it is removed */
	unregisterStar: (value: number, el: HTMLButtonElement | undefined) => void;
}
