import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function FunnyButtonApp(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @component */
	FunnyButton(t_fragment_0, t_comp_anchor_1, undefined, $context);

	let t_comp_anchor_2 = t_anchor(t_next(t_next(t_comp_anchor_1, true))) as HTMLElement;

	/* @component */
	const t_slots_1: Record<string, SlotRender> = {};
	t_slots_1["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `Click me!`);
		const t_text_1 = t_root(t_fragment_2);
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_text_1);
		t_next(t_text_1);
	}
	FunnyButton(t_fragment_0, t_comp_anchor_2, undefined, $context, t_slots_1);

	const t_text_2 = t_next(t_comp_anchor_2, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}

function FunnyButton(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <button style=" background: rgba(0, 0, 0, 0.4); color: #fff; padding: 10px 20px; font-size: 30px; border: 2px solid #fff; margin: 8px; transform: scale(0.9); box-shadow: 4px 4px rgba(0, 0, 0, 0.4); transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s; outline: 0; "> <!> </button> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_slot_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_next(t_child(t_slot_parent_1))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_slot_parent_1, t_slot_anchor_1, undefined, $context)
	} else {
		const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <span>No content found</span> `);
		const t_root_1 = t_root(t_fragment_1, true);
		const t_text_1 = t_next(t_next(t_root_1), true);
		t_add_fragment(t_fragment_1, t_slot_parent_1, t_slot_anchor_1, t_text_1);
		t_next(t_text_1);
	}
	const t_text_2 = t_next(t_slot_parent_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
