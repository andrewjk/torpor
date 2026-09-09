import type { Command } from "./CommandTypes";

export const CommandPaletteContextName: unique symbol = Symbol.for("torp.CommandPalette");

export interface CommandPaletteContext {
	/** The ID of the command list, for the input's aria-controls */
	getListId: () => string;
	/** The ID of a command option, for aria-activedescendant */
	getItemId: (index: number) => string;
	/** The ID of the active command option */
	getActiveItemId: () => string;
	/** Text to display in the input when it is empty */
	getPlaceholder: () => string | undefined;
	/** An accessible name for the input */
	getAriaLabel: () => string | undefined;
	/** Handles typing in the input */
	handleInput: (e: Event) => void;
	/** Handles arrow/Enter/Escape keys in the input */
	handleKey: (e: KeyboardEvent) => void;
	/** Called from the input when it is added */
	registerInput: (el: HTMLInputElement) => void;
	/** Called from the input when it is removed */
	unregisterInput: (el: HTMLInputElement) => void;
	/** The commands that match the current search text */
	getFilteredCommands: () => Command[];
	/** Whether a command is the active (highlighted) one */
	isActiveCommand: (index: number) => boolean;
	/** Runs a command and closes the palette */
	runCommand: (command: Command | undefined) => void;
	/** Text to display when no commands match the search */
	getEmptyText: () => string;
}
