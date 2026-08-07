import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function AttrNull(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { title: string | null; label: string | undefined; count: number | null },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div data-count=""> Content </div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	$run(() => {
		t_attribute(t_div_1, "title", $props.title);
		t_attribute(t_div_1, "aria-label", $props.label);
		t_attribute(t_div_1, "data-count", $props.count);
	});
	t_add_element(t_div_1, $parent, $anchor);
	t_next(t_div_1);

}
