import $peek from "../../../../src/watch/$peek";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

interface Props {
	/** The value to switch on */
	value: number
}

/**
 * A component with a switch statement in it.
 */
export default function Switch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Props,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_switch_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @switch */
	const t_switch_region_1 = t_region();
	let t_switch_index_1 = -1;
	t_run_control(t_switch_region_1, t_switch_anchor_1, (t_before) => {
		switch ($props.value) {
			case 1: {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 0)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p> A small value. </p> `);
				const t_root_1 = t_root(t_fragment_1, true);
				const t_text_1 = t_next(t_next(t_root_1), true);
				t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_1);
				t_next(t_text_1);
				t_pop_region(t_old_region);
				t_switch_index_1 = 0;
				break;
			}
			case 100: {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 1)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p> A large value. </p> `);
				const t_root_2 = t_root(t_fragment_2, true);
				const t_text_2 = t_next(t_next(t_root_2), true);
				t_add_fragment(t_fragment_2, t_fragment_0, t_before, t_text_2);
				t_next(t_text_2);
				t_pop_region(t_old_region);
				t_switch_index_1 = 1;
				break;
			}
			default: {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 2)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <p> Another value. </p> `);
				const t_root_3 = t_root(t_fragment_3, true);
				const t_text_3 = t_next(t_next(t_root_3), true);
				t_add_fragment(t_fragment_3, t_fragment_0, t_before, t_text_3);
				t_next(t_text_3);
				t_pop_region(t_old_region);
				t_switch_index_1 = 2;
				break;
			}
		}
	});

	const t_text_4 = t_next(t_switch_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

}
