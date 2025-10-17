import $peek from "../../../../src/watch/$peek";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

import ChildA from "../output/./ChildA-client";
import ChildB from "../output/./ChildB-client";

export default function Parent(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$context = Object.assign({}, $context);
	$peek(() => { /**/

	$context["ParentContext"] = "hi from the parent";

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @component */
	ChildA(t_fragment_0, t_comp_anchor_1, undefined, $context);

	let t_comp_anchor_2 = t_anchor(t_next(t_next(t_comp_anchor_1, true))) as HTMLElement;

	/* @component */
	ChildB(t_fragment_0, t_comp_anchor_2, undefined, $context);

	const t_text_1 = t_next(t_comp_anchor_2, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

	/**/ });
}
