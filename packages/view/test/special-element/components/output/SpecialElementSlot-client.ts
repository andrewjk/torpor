import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_dynamic from "../../../../src/render/setDynamicElement";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Element(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
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
	const t_props_1 = $watch({
		tag: $props.tag,
	});
	$run(() => {
		t_props_1["tag"] = $props.tag;
	});
	const t_slots_1: Record<string, SlotRender> = {};
	t_slots_1["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` Hello! `);
		const t_text_1 = t_root(t_fragment_2);
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_text_1);
		t_next(t_text_1);
	}
	Child(t_fragment_0, t_comp_anchor_1, t_props_1, $context, t_slots_1);

	const t_text_2 = t_next(t_comp_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <el> <!> </el> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_element_1 = t_next(t_root_0) as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_next(t_child(t_element_1))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_element_1, t_slot_anchor_1, undefined, $context)
	}
	const t_text_1 = t_next(t_element_1, true);
	$run(() => {
		t_element_1 = t_dynamic(t_element_1, $props.tag);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
