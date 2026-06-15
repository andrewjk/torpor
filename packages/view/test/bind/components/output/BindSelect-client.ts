import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function SelectBind(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { value: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <select> <option value="a">Option A</option> <option value="b">Option B</option> <option value="c">Option C</option> </select> <p>#</p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_select_1 = t_next(t_root_0) as HTMLSelectElement;
	const t_text_1 = t_child(t_next(t_next(t_select_1, true)));
	const t_text_2 = t_next(t_next(t_next(t_select_1, true)), true);
	$run(() => {
		t_select_1.value = $props.value || "";
	});
	t_event(t_select_1, "change", (e) => $props.value = e.target.value);
	$run(() => {
		t_text_1.textContent = `Selected: ${t_fmt($props.value)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
