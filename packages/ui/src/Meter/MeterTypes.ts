export const MeterContextName: unique symbol = Symbol("Meter");

export interface MeterContext {
	/** The percentage of the range that the value represents (0..100) */
	getPct: () => number;
	/** How the value rates compared to the low/high/optimum thresholds */
	getState: () => "optimum" | "suboptimum" | "poor";
}
