export const ToggleGroupContextName: unique symbol = Symbol("ToggleGroup");

export interface ToggleItemState {
	/** Assigned by the group in registration order */
	index?: number;
	/** The value submitted while this button is pressed */
	value: any;
	/** Disabled buttons ignore interaction */
	disabled?: boolean;
}

export interface ToggleGroupContext {
	/** Adds a button to the group; returns its state */
	registerItem: (value: any, disabled: boolean | undefined) => ToggleItemState;
	/** Removes a button by index */
	removeItem: (index: number) => void;
	/** Whether a value is currently pressed */
	isPressed: (value: any) => boolean;
	/** Toggles a value, reporting the change */
	toggle: (value: any) => void;
	/** Whether the whole group is disabled */
	getDisabled: () => boolean;
}
