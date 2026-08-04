import $mount from "../../../../src/watch/$mount";
import t_add_element from "../../../../src/render/addElement";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function OnMount(
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

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<input>`);
	const t_input_1 = t_root_el(t_fragment_0) as HTMLInputElement;
	// @ts-ignore
	$mount(() => {
		return ((node) => node.value = "hi")(t_input_1);
	});
	t_add_element(t_input_1, $parent, $anchor);
	t_next(t_input_1);

}
