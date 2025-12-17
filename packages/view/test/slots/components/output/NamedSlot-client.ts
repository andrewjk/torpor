import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Named(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

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
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p> The article's body </p> `);
		const t_root_2 = t_root(t_fragment_2, true);
		const t_text_1 = t_next(t_next(t_root_2), true);
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_text_1);
		t_next(t_text_1);
	}
	t_slots_1["header"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` The article's header `);
		const t_text_2 = t_root(t_fragment_3);
		t_add_fragment(t_fragment_3, $sparent, $sanchor, t_text_2);
		t_next(t_text_2);
	}
	Article(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);

	const t_text_3 = t_next(t_comp_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}

function Article(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <section> <h2> <!> </h2> <!> <!> </section> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_slot_parent_1 = t_next(t_child(t_next(t_root_0))) as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_next(t_child(t_slot_parent_1))) as HTMLElement;
	if ($slots && $slots["header"]) {
		$slots["header"](t_slot_parent_1, t_slot_anchor_1, undefined, $context)
	}
	const t_slot_parent_2 = t_next(t_root_0) as HTMLElement;
	let t_slot_anchor_2 = t_anchor(t_next(t_next(t_slot_parent_1, true))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_slot_parent_2, t_slot_anchor_2, undefined, $context)
	}
	const t_slot_parent_3 = t_slot_parent_2 as HTMLElement;
	let t_slot_anchor_3 = t_anchor(t_next(t_next(t_slot_anchor_2, true))) as HTMLElement;
	if ($slots && $slots["footer"]) {
		$slots["footer"](t_slot_parent_3, t_slot_anchor_3, undefined, $context)
	}
	const t_text_1 = t_next(t_slot_parent_3, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
