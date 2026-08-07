import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_event from "../../../../src/render/addEvent";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function MultiSelectBind(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { values: string[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<select multiple><option value="a">A</option><option value="b">B</option><option value="c">C</option></select>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_select_1 = t_root_0 as HTMLSelectElement;
	$run(() => {
		Array.from(t_select_1.options).forEach((opt) => opt.selected = Array.isArray($props.values) && $props.values.includes(opt.value));
	});
	t_event(t_select_1, "change", (e) => $props.values = Array.from(e.target.selectedOptions).map((opt) => opt.value));
	t_add_element(t_select_1, $parent, $anchor);
	t_next(t_select_1);

}
