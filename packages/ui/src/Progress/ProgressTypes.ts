export const ProgressContextName: unique symbol = Symbol.for("torp.Progress");

export interface ProgressContext {
	/** Whether the extent is unknown (no value was passed) */
	isIndeterminate: () => boolean;
	/** The percentage of the range that the value represents (0..100) */
	getPct: () => number;
}
