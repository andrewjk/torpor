import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function TernaryServer(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { on: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<button role="radio" data-state="">Hello</button>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_button_1 = t_root_0 as HTMLButtonElement;
	$run(() => {
		t_attribute(t_button_1, "tabindex", $props.on ? 0 : -1);
		t_attribute(t_button_1, "aria-checked", $props.on ? "true" : "false");
		t_attribute(t_button_1, "data-state", $props.on ? "active" : "inactive");
	});
	t_add_element(t_button_1, $parent, $anchor);
	t_next(t_button_1);

}
