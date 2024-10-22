import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_root } from "@tera/view";

export default function BigTitle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<h2> <!> </h2>`);
	const t_h2_1 = t_root(t_fragment_0) as HTMLElement;
	const t_slot_anchor_1 = t_anchor(t_next(t_child(t_h2_1))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_h2_1, t_slot_anchor_1, undefined, $context)
	}
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

