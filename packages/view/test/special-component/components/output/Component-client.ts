import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

import BigTitle from "../output/./BigTitle-client";
import SmallTitle from "../output/./SmallTitle-client";

export default function Component(
	$parent: ParentNode,
	$anchor: Node | null,
	$props,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	let components = {
		BigTitle,
		SmallTitle
	};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	let t_replace_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @replace */
	const t_replace_range_1 = t_range();
	t_run_control(t_replace_range_1, t_replace_anchor_1, (t_before) => {
		components[$props.self];
		t_run_branch(t_replace_range_1, -1, () => {
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			// @ts-ignore
			const t_root_1 = t_root(t_fragment_1);
			let t_comp_anchor_1 = t_anchor(t_root_1) as HTMLElement;

			/* @component */
			const t_props_1: any = $watch({});
			const t_slots_1: Record<string, SlotRender> = {};
			t_slots_1["_"] = (
				$sparent: ParentNode,
				$sanchor: Node | null,
				//@ts-ignore
				$sprops?: Record<PropertyKey, any>,
				//@ts-ignore
				$context?: Record<PropertyKey, any>
			) => {
				const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` Hello! `);
				// @ts-ignore
				const t_text_1 = t_root(t_fragment_3);
				t_add_fragment(t_fragment_3, $sparent, $sanchor, t_text_1);
				t_next(t_text_1);
			}
			components[$props.self](t_fragment_1, t_comp_anchor_1, t_props_1, $context, t_slots_1);

			t_add_fragment(t_fragment_1, t_fragment_0, t_before);
		});
	});

	// @ts-ignore
	const t_text_2 = t_next(t_replace_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
