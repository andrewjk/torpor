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
	/**
	 * `false` when the fragment is never rendered through the
	 * `buildFragment` cache path (which is what references the `t_fragments`
	 * / `t_fragment_els` arrays). Currently only `@html` branches, which build
	 * their content at runtime from an innerHTML string and only use the
	 * fragment's `number` for naming. Excludes such fragments from the
	 * decision to declare `t_fragments`, avoiding an unused declaration.
	 */
	usesFragmentCache?: boolean;
}
