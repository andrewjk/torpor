import $onmount from "../../../../src/watch/$onmount";
import t_add_element from "../../../../src/render/addElement";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function InputFocused(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let inputElement: HTMLInputElement;

	$onmount(() => {
		// HACK: This is easier to test for
		inputElement.value = "hi";
	});

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<input>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_input_1 = t_root_0 as HTMLInputElement;
	inputElement = t_input_1;
	t_add_element(t_input_1, $parent, $anchor);
	t_next(t_input_1);

}
