import t_add_element from "../../../../src/render/addElement";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function PreHydrate(
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

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<pre>line1 line2 line3</pre>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_pre_1 = t_root_0 as HTMLElement;
	t_add_element(t_pre_1, $parent, $anchor);
	t_next(t_pre_1);

}
