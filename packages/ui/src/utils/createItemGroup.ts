import { $run } from "@torpor/view";

export interface ItemGroupItem {
	index: number;
	value: any;
	parentDisabled?: boolean;
}

export interface ItemGroup<T extends ItemGroupItem> {
	itemStates: T[];
	registerItem: (item: T) => void;
	removeItem: (itemIndex: number) => void;
	toggleItem: (value: any) => void;
}

/**
 * Creates a managed collection of selectable items for group-style components
 * (Accordion, ListBox, TabGroup, Tree, etc.).
 *
 * Handles item registration, removal, toggle logic, and reactive syncing of
 * each item's selection state from the group's value — eliminating the
 * boilerplate that was duplicated across ~5 components.
 *
 * The returned `itemStates` array is the source of truth; components should
 * store it in their context for child items to access.
 */
export function createItemGroup<T extends ItemGroupItem>(options: {
	/** The reactive state containing the group value */
	state: { value: any };
	/** Selection type, or a getter for it if it can change */
	type: "single" | "multiple" | (() => "single" | "multiple");
	/** The boolean property on items that reflects selection state */
	selectedProperty: keyof T;
	/** Getter for parent disabled state */
	disabled?: () => boolean | undefined;
	/** Allow deselecting in single-select mode (default: true) */
	allowDeselect?: boolean;
	/** Called for each item after index assignment but before selection check */
	onRegister?: (item: T) => void;
	/** Callback after a toggle, for side effects like closing a popout */
	onToggle?: (value: any) => void;
}): ItemGroup<T> {
	const { state, selectedProperty } = options;
	const getType = typeof options.type === "function" ? options.type : () => options.type;
	const allowDeselect = options.allowDeselect ?? true;
	const itemStates: T[] = [];
	let nextIndex = 0;

	// Sync each item's selection state from the group value
	$run(() => {
		const value = state.value;
		switch (getType()) {
			case "single": {
				for (let item of itemStates) {
					(item as any)[selectedProperty] = item.value === value;
				}
				break;
			}
			case "multiple": {
				const values = Array.isArray(value) ? value : value !== undefined ? [value] : [];
				for (let item of itemStates) {
					(item as any)[selectedProperty] = values.indexOf(item.value) !== -1;
				}
				break;
			}
		}
	});

	// Propagate disabled state from parent
	if (options.disabled) {
		const disabledGetter = options.disabled;
		$run(() => {
			const disabled = disabledGetter() === true;
			for (let item of itemStates) {
				item.parentDisabled = disabled;
			}
		});
	}

	function isItemSelected(item: T, value: any): boolean {
		if (value === undefined || value === null) return false;
		if (getType() === "multiple") {
			const values = Array.isArray(value) ? value : [value];
			return values.indexOf(item.value) !== -1;
		}
		return item.value === value;
	}

	function registerItem(item: T) {
		if (item.index === -1 || item.index === undefined) {
			item.index = nextIndex++;
		}
		if (options.onRegister) {
			options.onRegister(item);
		}
		(item as any)[selectedProperty] = isItemSelected(item, state.value);
		if (options.disabled) {
			item.parentDisabled = options.disabled() === true;
		}
		itemStates.splice(item.index, 0, item);
	}

	function removeItem(itemIndex: number) {
		const index = itemStates.findIndex((item) => item.index === itemIndex);
		if (index !== -1) {
			itemStates.splice(index, 1);
		}
		itemStates.forEach((item, i) => (item.index = i));
	}

	function toggleItem(value: any) {
		switch (getType()) {
			case "single": {
				if (allowDeselect) {
					for (let item of itemStates) {
						if (item.value === value) {
							state.value = (item as any)[selectedProperty] ? undefined : item.value;
							break;
						}
					}
				} else {
					state.value = value;
				}
				break;
			}
			case "multiple": {
				const newValue: any[] = [];
				for (let item of itemStates) {
					if (
						(item.value === value && !(item as any)[selectedProperty]) ||
						(item.value !== value && (item as any)[selectedProperty])
					) {
						newValue.push(item.value);
					}
				}
				state.value = newValue.sort();
				break;
			}
		}
		if (options.onToggle) {
			options.onToggle(value);
		}
	}

	return { itemStates, registerItem, removeItem, toggleItem };
}
