import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

import Header from './Header.tera'

export default function Basic(
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
		const t_fragment_2 = t_fragment(t_fragments, 2, ` Basic stuff `);
		const t_text_1 = t_root(t_fragment_2);
		t_add_fragment(t_fragment_2, $sparent, $sanchor);
	}

	Header(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

