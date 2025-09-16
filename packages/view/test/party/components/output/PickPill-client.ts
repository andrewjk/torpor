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

export default function PickPill(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
) {

	let $state = $watch({
		picked: "red"
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div>#</div> <input id="blue-pill" type="radio" value="blue"></input> <label for="blue-pill">Blue pill</label> <input id="red-pill" type="radio" value="red"></input> <label for="red-pill">Red pill</label> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_input_1 = t_next(t_next(t_next(t_root_0), true)) as HTMLInputElement;
	const t_input_2 = t_next(t_next(t_next(t_next(t_input_1, true)), true)) as HTMLInputElement;
	// @ts-ignore
	const t_text_2 = t_next(t_next(t_next(t_input_2, true)), true);
	$run(function setTextContent() {
		t_text_1.textContent = `Picked: ${t_fmt($state.picked)}`;
	});
	$run(function setBinding() {
		t_input_1.checked = $state.picked == "blue";
	});
	t_event(t_input_1, "change", (e) => {
		if (e.target.checked) $state.picked = "blue";
	});
	$run(function setBinding() {
		t_input_2.checked = $state.picked == "red";
	});
	t_event(t_input_2, "change", (e) => {
		if (e.target.checked) $state.picked = "red";
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
