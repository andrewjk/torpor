import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

import Article from "./Article-client"

export default function Named(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	const t_slots_1 = {};
	t_slots_1["_"] = ($sparent: ParentNode, $sanchor: Node | null, $sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		const t_fragment_2 = t_fragment(t_fragments, 2, ` <p> The article's body </p> `);
		const t_root_2 = t_root(t_fragment_2);
		const t_text_1 = t_next(t_next(t_root_2));
		t_add_fragment(t_fragment_2, $sparent, $sanchor);
		t_next(t_text_1);
	}
	t_slots_1["header"] = ($sparent: ParentNode, $sanchor: Node | null, $sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		const t_fragment_3 = t_fragment(t_fragments, 3, ` The article's header `);
		const t_text_2 = t_root(t_fragment_3);
		t_add_fragment(t_fragment_3, $sparent, $sanchor);
	}
	Article(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
