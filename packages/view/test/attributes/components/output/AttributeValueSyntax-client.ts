import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_attribute from "../../../../src/render/setAttribute";
import t_class from "../../../../src/render/buildClasses";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function AttributeValueSyntax(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div data-json='{"a":1}' data-template='\x24{literal}' data-class="static {braces}"></div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	$run(() => {
		t_attribute(t_div_1, "title", `hello ${$props.name}`);
		t_div_1.className = t_class($props.name);
	});
	t_add_element(t_div_1, $parent, $anchor);

}
