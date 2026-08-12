import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function TryNoCatch(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
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
		if (!t_run_branch(t_try_region_1, t_try_index_1, 0)) return;
		const t_new_region = t_region();
		const t_old_region = t_push_region(t_new_region, true);
		const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>Fine</p>`);
		const t_root_1 = t_root_el(t_fragment_1);
		const t_p_1 = t_root_1 as HTMLElement;
		t_add_element(t_p_1, t_fragment_0, t_before);
		t_next(t_p_1);
		t_pop_region(t_old_region);
		t_try_index_1 = 0;
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_try_anchor_1, t_root_0);
	t_next(t_try_anchor_1);

}
