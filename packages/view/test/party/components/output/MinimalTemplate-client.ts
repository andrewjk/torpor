import t_add_element from "../../../../src/render/addElement";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function HelloWorld(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<h1>Hello world</h1>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_h1_1 = t_root_0 as HTMLElement;
	t_add_element(t_h1_1, $parent, $anchor);
	t_next(t_h1_1);

}
