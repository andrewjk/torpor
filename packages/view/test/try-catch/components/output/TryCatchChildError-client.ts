import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_restore_hydration from "../../../../src/render/restoreHydration";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import t_save_hydration from "../../../../src/render/saveHydration";
import type SlotRender from "../../../../src/types/SlotRender";

function Thrower(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	function boom() {
		throw new Error("child boom");
	}

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_if_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if (boom()) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>This is never rendered</p>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_p_1 = t_root_1 as HTMLElement;
			t_add_element(t_p_1, t_fragment_0, t_before);
			t_next(t_p_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			t_if_index_1 = 1;
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_if_anchor_1, t_root_0);
	t_next(t_if_anchor_1);

}

export default function TryCatchChildError(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_try_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @try */
	const t_try_region_1 = t_region();
	let t_try_index_1 = -1;
	t_run_control(t_try_region_1, t_try_anchor_1, (t_before) => {
		const t_hydration_snapshot_1 = t_save_hydration();
		try {
			if (!t_run_branch(t_try_region_1, t_try_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			const t_root_1 = t_root(t_fragment_1);
			let t_comp_anchor_1 = t_anchor(t_root_1) as HTMLElement;

			/* @component */
			Thrower(t_fragment_1, t_comp_anchor_1, undefined, $context);

			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_comp_anchor_1, t_root_1);
			t_next(t_comp_anchor_1);
			t_pop_region(t_old_region);
			t_try_index_1 = 0;
		}
		catch (err) {
			t_push_region(t_try_region_1);
			t_restore_hydration(t_hydration_snapshot_1);
			t_try_index_1 = -1;
			if (!t_run_branch(t_try_region_1, t_try_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p class="error">#</p>`);
			const t_root_2 = t_root_el(t_fragment_2);
			const t_p_1 = t_root_2 as HTMLElement;
			const t_text_1 = t_child(t_p_1);
			$run(() => {
				t_text_1.textContent = `Caught: ${t_fmt(err.message)}`;
			});
			t_add_element(t_p_1, t_fragment_0, t_before);
			t_next(t_p_1);
			t_pop_region(t_old_region);
			t_try_index_1 = 1;
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_try_anchor_1, t_root_0);
	t_next(t_try_anchor_1);

}
