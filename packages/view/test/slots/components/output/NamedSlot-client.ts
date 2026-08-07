import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Named(
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
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

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
		const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p> The article's body </p>`);
		const t_root_2 = t_root_el(t_fragment_2);
		const t_p_1 = t_root_2 as HTMLElement;
		t_add_element(t_p_1, $sparent, $sanchor);
		t_next(t_p_1);
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
		const t_root_3 = t_root(t_fragment_3, true);
		const t_text_1 = t_root_3;
		t_add_fragment(t_fragment_3, $sparent, $sanchor, t_text_1, t_root_3);
		t_next(t_text_1);
	}
	Article(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_comp_anchor_1, t_root_0);
	t_next(t_comp_anchor_1);

}

function Article(
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
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<section><h2><!></h2> <!> <!></section>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_section_1 = t_root_0 as HTMLElement;
	const t_slot_parent_1 = t_child(t_section_1) as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_child(t_slot_parent_1)) as HTMLElement;
	if ($slots && $slots["header"]) {
		$slots["header"](t_slot_parent_1, t_slot_anchor_1, undefined, $context)
	}
	let t_slot_anchor_2 = t_anchor(t_next(t_next(t_slot_parent_1, true))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_section_1, t_slot_anchor_2, undefined, $context)
	}
	let t_slot_anchor_3 = t_anchor(t_next(t_next(t_slot_anchor_2, true))) as HTMLElement;
	if ($slots && $slots["footer"]) {
		$slots["footer"](t_section_1, t_slot_anchor_3, undefined, $context)
	}
	t_add_element(t_section_1, $parent, $anchor);
	t_next(t_section_1);

}
