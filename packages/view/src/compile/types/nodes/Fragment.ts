import type SourceSpan from "../SourceSpan";

export default interface Fragment {
	number: number;
	text: string;
	ns: boolean;
	effects: {
		functionBody: string;
		spans: SourceSpan[];
		offsets: number[];
		lengths: number[];
	}[];
	events: {
		varName: string;
		eventName: string;
		handler: string;
	}[];
	animations: string[];
	endVarName?: string;
	/**
	 * The variable name holding the fragment's first DOM node (the root).
	 * Used to restore the active region's `startNode` during hydration —
	 * child component rendering (via `addElement`) can overwrite it before
	 * `addFragment` runs.
	 */
	rootVarName?: string;
	/**
	 * Set during `buildFragmentText` when the fragment has exactly one
	 * rendering root child and that child is an `Element`. The compiler then
	 * emits the `t_fragment_el` / `t_root_el` / `t_add_element` path, which
	 * clones the cached template's `firstElementChild` directly into the
	 * parent — skipping the per-instance `DocumentFragment` wrapper that
	 * `getFragment` produces. Wins on per-row allocation in bulk-create paths
	 * (e.g. `@for` rows in the js-framework-bench `run`/`add`/`runlots` ops).
	 */
	singleRootElement?: boolean;
}
