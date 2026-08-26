export interface Command {
	/** A value identifying the command */
	value: any;
	/** The display label for the command */
	label: string;
	/** Extra text that is matched when searching, but isn't displayed */
	keywords?: string;
	/** A keyboard shortcut hint to display, e.g. "⌘N" */
	shortcut?: string;
	/** If set to true, the command can't be run */
	disabled?: boolean;
	/** The function to call when the command is run */
	run?: () => void;
}
