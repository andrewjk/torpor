import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_range from "../../../../src/render/newRange";
import t_reanchor from "../../../../src/render/nodeReanchor";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

/**
 * A component with a switch statement in it.
 */
export default function Switch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		/** The value to switch on */
		value: number
	},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> <!> </div> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_switch_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_switch_anchor_1 = t_anchor(t_next(t_child(t_switch_parent_1))) as HTMLElement;

	/* @switch */
	const t_switch_range_1 = t_range();
	t_run_control(t_switch_range_1, t_switch_anchor_1, (t_before) => {
		switch ($props.value) {
			case 1: {
				t_run_branch(t_switch_range_1, 0, () => {
					const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p> A small value. </p> `);
					// @ts-ignore
					const t_root_1 = t_root(t_fragment_1, true);
					// @ts-ignore
					const t_text_1 = t_next(t_next(t_root_1), true);
					t_add_fragment(t_fragment_1, t_switch_parent_1, t_before, t_text_1);
					t_next(t_text_1);
				});
				break;
			}
			case 100: {
				t_run_branch(t_switch_range_1, 1, () => {
					const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p> A large value. </p> `);
					// @ts-ignore
					const t_root_2 = t_root(t_fragment_2, true);
					// @ts-ignore
					const t_text_2 = t_next(t_next(t_root_2), true);
					t_add_fragment(t_fragment_2, t_switch_parent_1, t_before, t_text_2);
					t_next(t_text_2);
				});
				break;
			}
			default: {
				t_run_branch(t_switch_range_1, 2, () => {
					const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <p> Another value. </p> `);
					// @ts-ignore
					const t_root_3 = t_root(t_fragment_3, true);
					// @ts-ignore
					const t_text_3 = t_next(t_next(t_root_3), true);
					t_add_fragment(t_fragment_3, t_switch_parent_1, t_before, t_text_3);
					t_next(t_text_3);
				});
				break;
			}
		}
	});

	t_switch_anchor_1 = t_reanchor(t_switch_anchor_1) as HTMLElement;

	// @ts-ignore
	const t_text_4 = t_next(t_switch_parent_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

}
