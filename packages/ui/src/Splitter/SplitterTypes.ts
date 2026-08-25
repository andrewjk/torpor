export const SplitterContextName: unique symbol = Symbol.for("torp.Splitter");

export interface SplitterPaneState {
	/** The index of the pane */
	index: number;
}

export interface SplitterContext {
	/** Called from a pane when it is added */
	registerPane: () => SplitterPaneState;
	/** Called from a pane when it is removed */
	removePane: (index: number) => void;
	/** The orientation of the splitter */
	getOrientation: () => "horizontal" | "vertical";
	/** The clamped percentage of the container taken up by the primary pane */
	getValue: () => number;
	/** The minimum percentage for the primary pane */
	getMin: () => number;
	/** The maximum percentage for the primary pane */
	getMax: () => number;
	/** The amount by which keyboard interaction changes the value */
	getStep: () => number;
	/** Whether the user cannot interact with the splitter */
	getDisabled: () => boolean;
	/** Sets the value, clamped to the min and max */
	setValue: (value: number) => void;
	/** The number of registered panes */
	count: () => number;
	/** The splitter's root element, used to convert pointer positions into values */
	getContainer: () => HTMLElement | undefined;
}
