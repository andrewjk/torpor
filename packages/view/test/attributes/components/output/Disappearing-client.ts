import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Attributes(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div data-thing=""> Hello! </div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	$run(() => {
		t_attribute(t_div_1, "thing", $props.thing);
		t_attribute(t_div_1, "data-thing", $props.dataThing);
		t_attribute(t_div_1, "caption", `this attribute is for ${$props.description}`);
		t_attribute(t_div_1, "attr", $props.attr);
	});
	t_add_element(t_div_1, $parent, $anchor);
	t_next(t_div_1);

}
