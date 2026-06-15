import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_event from "../../../../src/render/addEvent";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
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

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <select multiple> <option value="a">A</option> <option value="b">B</option> <option value="c">C</option> </select> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_select_1 = t_next(t_root_0) as HTMLSelectElement;
	const t_text_1 = t_next(t_select_1, true);
	$run(() => {
		t_select_1.value = $props.values || "";
	});
	t_event(t_select_1, "change", (e) => $props.values = e.target.value);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
