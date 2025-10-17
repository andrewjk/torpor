import $peek from "../../../../src/watch/$peek";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function SmallTitle(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <h6> <!> </h6> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_slot_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_next(t_child(t_slot_parent_1))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_slot_parent_1, t_slot_anchor_1, undefined, $context)
	}
	const t_text_1 = t_next(t_slot_parent_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

	/**/ });
}
