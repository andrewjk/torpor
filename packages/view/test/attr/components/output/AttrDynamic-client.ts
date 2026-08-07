import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function AttrDynamic(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { id: string; title: string; dataValue: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div data-value=""> Content </div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	$run(() => {
		t_attribute(t_div_1, "id", $props.id);
		t_attribute(t_div_1, "title", $props.title);
		t_attribute(t_div_1, "data-value", $props.dataValue);
	});
	t_add_element(t_div_1, $parent, $anchor);
	t_next(t_div_1);

}
