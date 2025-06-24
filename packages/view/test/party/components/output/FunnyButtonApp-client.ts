import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

import FunnyButton from "../output/./FunnyButton-client";

export default function FunnyButtonApp(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> <!> <!> </div> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_comp_parent_1 = t_next(t_root_0) as HTMLElement;
	const t_comp_anchor_1 = t_anchor(t_next(t_child(t_comp_parent_1))) as HTMLElement;

	/* @component */
	FunnyButton(t_comp_parent_1, t_comp_anchor_1, undefined, $context);

	const t_comp_parent_2 = t_comp_parent_1 as HTMLElement;
	const t_comp_anchor_2 = t_anchor(t_next(t_next(t_anchor(t_comp_anchor_1, true), true))) as HTMLElement;

	/* @component */
	const t_slots_1: Record<string, SlotRender> = {};
	t_slots_1["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		//@ts-ignore
		$sprops?: Record<PropertyKey, any>,
		//@ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `Click me!`);
		// @ts-ignore
		const t_text_1 = t_root(t_fragment_2);
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_text_1);
		t_next(t_text_1);
	}
	FunnyButton(t_comp_parent_2, t_comp_anchor_2, undefined, $context, t_slots_1);

	// @ts-ignore
	const t_text_2 = t_next(t_comp_parent_2, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
