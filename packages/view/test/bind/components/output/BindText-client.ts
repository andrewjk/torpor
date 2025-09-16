import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function BindText(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
) {

	let $state = $watch({ name: "Alice", selected: 1 });

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <input></input> <select> <option value=0>First</option> <option value=1>Second</option> <option value=2>Third</option> </select> <p>#</p> <p>#</p> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_input_1 = t_next(t_root_0) as HTMLInputElement;
	const t_select_1 = t_next(t_next(t_input_1, true)) as HTMLElement;
	const t_text_1 = t_child(t_next(t_next(t_select_1, true)));
	const t_text_2 = t_child(t_next(t_next(t_next(t_next(t_select_1, true)), true)));
	// @ts-ignore
	const t_text_3 = t_next(t_next(t_next(t_next(t_next(t_select_1, true)), true)), true);
	$run(function setBinding() {
		t_input_1.value = $state.name || "";
	});
	t_event(t_input_1, "input", (e) => $state.name = e.target.value);
	$run(function setBinding() {
		t_select_1.value = $state.selected || "";
	});
	t_event(t_select_1, "change", (e) => $state.selected = e.target.value);
	$run(function setTextContent() {
		t_text_1.textContent = `Hello, ${t_fmt($state.name)}`;
	});
	$run(function setTextContent() {
		t_text_2.textContent = `You have selected, ${t_fmt($state.selected)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}
