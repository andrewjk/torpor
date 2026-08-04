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

export default function SwitchString(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { status: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	let t_switch_anchor_1 = t_anchor(t_root(t_fragment_0)) as HTMLElement;

	/* @switch */
	const t_switch_region_1 = t_region();
	let t_switch_index_1 = -1;
	t_run_control(t_switch_region_1, t_switch_anchor_1, (t_before) => {
		switch ($props.status) {
			case "loading": {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 0)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>Loading...</p>`);
				const t_p_1 = t_root_el(t_fragment_1) as HTMLElement;
				t_add_element(t_p_1, t_fragment_0, t_before);
				t_next(t_p_1);
				t_pop_region(t_old_region);
				t_switch_index_1 = 0;
				break;
			}
			case "success": {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 1)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>Loaded!</p>`);
				const t_p_2 = t_root_el(t_fragment_2) as HTMLElement;
				t_add_element(t_p_2, t_fragment_0, t_before);
				t_next(t_p_2);
				t_pop_region(t_old_region);
				t_switch_index_1 = 1;
				break;
			}
			case "error": {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 2)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<p>Error occurred</p>`);
				const t_p_3 = t_root_el(t_fragment_3) as HTMLElement;
				t_add_element(t_p_3, t_fragment_0, t_before);
				t_next(t_p_3);
				t_pop_region(t_old_region);
				t_switch_index_1 = 2;
				break;
			}
			default: {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 3)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_4 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 4, `<p>Idle</p>`);
				const t_p_4 = t_root_el(t_fragment_4) as HTMLElement;
				t_add_element(t_p_4, t_fragment_0, t_before);
				t_next(t_p_4);
				t_pop_region(t_old_region);
				t_switch_index_1 = 3;
				break;
			}
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);

}
