/**
 * Server stubs for the client-only runtime, so that modules compiled for the
 * client -- or shared helpers that import them from the main `@torpor/view`
 * entry -- still resolve when they end up in a server bundle (the SSR
 * environment resolves `@torpor/view` to this module; see @torpor/build's
 * ssr-view plugin).
 *
 * They throw when called: mounting, hydrating and DOM rendering must not run
 * during SSR. Importing them is fine, which keeps a stray client-only import
 * from failing the server build.
 */
type Unavailable = (...args: unknown[]) => never;

function unavailable(name: string): Unavailable {
	return (..._args: unknown[]): never => {
		throw new Error(`${name} is not available during server rendering`);
	};
}

export const mount: Unavailable = unavailable("mount");
export const hydrate: Unavailable = unavailable("hydrate");
export const unmount: Unavailable = unavailable("unmount");
export const fillLayoutSlot: Unavailable = unavailable("fillLayoutSlot");
export const clearLayoutSlot: Unavailable = unavailable("clearLayoutSlot");

export const t_add_element: Unavailable = unavailable("t_add_element");
export const t_add_fragment: Unavailable = unavailable("t_add_fragment");
export const t_anchor: Unavailable = unavailable("t_anchor");
export const t_animate: Unavailable = unavailable("t_animate");
export const t_apply_props: Unavailable = unavailable("t_apply_props");
export const t_attribute: Unavailable = unavailable("t_attribute");
export const t_child: Unavailable = unavailable("t_child");
export const t_dynamic: Unavailable = unavailable("t_dynamic");
export const t_event: Unavailable = unavailable("t_event");
export const t_first_inside: Unavailable = unavailable("t_first_inside");
export const t_fragment: Unavailable = unavailable("t_fragment");
export const t_fragment_el: Unavailable = unavailable("t_fragment_el");
export const t_head_element: Unavailable = unavailable("t_head_element");
export const t_list_item: Unavailable = unavailable("t_list_item");
export const t_next: Unavailable = unavailable("t_next");
export const t_pop_region: Unavailable = unavailable("t_pop_region");
export const t_push_region: Unavailable = unavailable("t_push_region");
export const t_region: Unavailable = unavailable("t_region");
export const t_rerun_region_effects: Unavailable = unavailable("t_rerun_region_effects");
export const t_restore_hydration: Unavailable = unavailable("t_restore_hydration");
export const t_root: Unavailable = unavailable("t_root");
export const t_root_el: Unavailable = unavailable("t_root_el");
export const t_run_await: Unavailable = unavailable("t_run_await");
export const t_run_branch: Unavailable = unavailable("t_run_branch");
export const t_run_control: Unavailable = unavailable("t_run_control");
export const t_run_list: Unavailable = unavailable("t_run_list");
export const t_run_try: Unavailable = unavailable("t_run_try");
export const t_save_hydration: Unavailable = unavailable("t_save_hydration");
export const t_skip: Unavailable = unavailable("t_skip");
