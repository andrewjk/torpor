import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Article(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<section> <h2> <!> </h2> <!> <!> </section>`);
	// @ts-ignore
	const t_section_1 = t_root(t_fragment_0) as HTMLElement;
	const t_slot_parent_1 = t_next(t_child(t_section_1)) as HTMLElement;
	const t_slot_anchor_1 = t_anchor(t_next(t_child(t_slot_parent_1))) as HTMLElement;
	if ($slots && $slots["header"]) {
		$slots["header"](t_slot_parent_1, t_slot_anchor_1, undefined, $context)
	}
	const t_slot_anchor_2 = t_anchor(t_next(t_slot_parent_1, 2)) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_section_1, t_slot_anchor_2, undefined, $context)
	}
	const t_slot_anchor_3 = t_anchor(t_next(t_slot_anchor_2, 2)) as HTMLElement;
	if ($slots && $slots["footer"]) {
		$slots["footer"](t_section_1, t_slot_anchor_3, undefined, $context)
	}
	t_add_fragment(t_fragment_0, $parent, $anchor, t_section_1);
	t_next(t_section_1);

}
