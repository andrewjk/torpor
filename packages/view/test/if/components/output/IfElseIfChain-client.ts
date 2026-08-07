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

export default function IfElseIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { count: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

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
		if ($props.count < 0) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>Negative</p>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_p_1 = t_root_1 as HTMLElement;
			t_add_element(t_p_1, t_fragment_0, t_before);
			t_next(t_p_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else if ($props.count === 0) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>Zero</p>`);
			const t_root_2 = t_root_el(t_fragment_2);
			const t_p_2 = t_root_2 as HTMLElement;
			t_add_element(t_p_2, t_fragment_0, t_before);
			t_next(t_p_2);
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
		else if ($props.count < 10) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 2)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<p>Small positive</p>`);
			const t_root_3 = t_root_el(t_fragment_3);
			const t_p_3 = t_root_3 as HTMLElement;
			t_add_element(t_p_3, t_fragment_0, t_before);
			t_next(t_p_3);
			t_pop_region(t_old_region);
			t_if_index_1 = 2;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 3)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_4 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 4, `<p>Large positive</p>`);
			const t_root_4 = t_root_el(t_fragment_4);
			const t_p_4 = t_root_4 as HTMLElement;
			t_add_element(t_p_4, t_fragment_0, t_before);
			t_next(t_p_4);
			t_pop_region(t_old_region);
			t_if_index_1 = 3;
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_if_anchor_1, t_root_0);
	t_next(t_if_anchor_1);

}
