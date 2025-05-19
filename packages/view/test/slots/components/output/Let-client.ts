import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

import List from "../output/./List-client"

export default function Let(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0);
	const t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	const t_props_1: any = $watch({});
	$run(function setProp() {
		t_props_1["items"] = $props.items;
	});
	const t_slots_1: Record<string, SlotRender> = {};
	t_slots_1["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		//@ts-ignore
		$sprops?: Record<PropertyKey, any>,
		//@ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `#`);
		// @ts-ignore
		const t_text_1 = t_root(t_fragment_2);
		$run(function setTextContent() {
			t_text_1.textContent = ` ${t_fmt($sprops.item.text)} `;
		});
		t_add_fragment(t_fragment_2, $sparent, $sanchor);
		t_next(t_text_1);
	}
	List(t_fragment_0, t_comp_anchor_1, t_props_1, $context, t_slots_1);
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
