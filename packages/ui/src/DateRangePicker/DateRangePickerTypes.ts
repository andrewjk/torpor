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
