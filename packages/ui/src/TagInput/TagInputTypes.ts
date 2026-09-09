export const TagInputContextName: unique symbol = Symbol.for("torp.TagInput");

export interface TagInputContext {
	/** Whether the user cannot interact with the input */
	getDisabled: () => boolean;
	/** Removes the tag at an index */
	removeTag: (index: number) => void;
	/** Placeholder text for the empty field */
	getPlaceholder: () => string | undefined;
	/** The text currently in the field */
	getText: () => string;
	/** Whether suggestions are loaded from a `load` function */
	hasLoader: () => boolean;
	/** Whether the suggestion list is open */
	isSuggestionsOpen: () => boolean;
	/** The ID of the active suggestion, for aria-activedescendant */
	getActiveSuggestionId: () => string | undefined;
	/** Handles typing in the field */
	handleFieldInput: (e: Event) => void;
	/** Handles keys in the field (arrows, Enter, comma, Backspace, Escape) */
	handleFieldKey: (e: KeyboardEvent) => void;
	/** Called from the field when it is added */
	registerField: (el: HTMLInputElement) => void;
	/** Called from the field when it is removed */
	unregisterField: (el: HTMLInputElement) => void;
	/** The current suggestions; suspends while loading */
	getSuggestions: () => any[];
	/** Extracts the display text for a suggestion */
	getSuggestionLabel: (item: any) => string;
	/** The ID of a suggestion option, for aria-activedescendant */
	getSuggestionId: (index: number) => string;
	/** Whether a suggestion is the active (highlighted) one */
	isActiveSuggestion: (index: number) => boolean;
	/** Highlights a suggestion */
	setActiveSuggestion: (index: number) => void;
	/** Adds a suggestion as a tag */
	pickSuggestion: (item: any) => void;
	/** The ID of the suggestion list, for aria-controls */
	getListId: () => string;
	/** An accessible name for the suggestion list */
	getAriaLabel: () => string | undefined;
}
