import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function IsAvailable(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	let $state = $watch({
		isAvailable: false
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument, t_fragments, 0, `<div> <div>#</div> <input id="is-available" type="checkbox"></input> <label for="is-available">Is available</label> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_child(t_div_1)));
	const t_input_1 = t_next(t_next(t_next(t_child(t_div_1)))) as HTMLInputElement;
	$run(function setTextContent() {
		t_text_1.textContent = t_fmt($state.isAvailable ? "Available" : "Not available");
	});
	$run(function setBinding() {
		t_input_1.checked = $state.isAvailable || false;
	});
	t_event(t_input_1, "input", (e) => $state.isAvailable = e.target.checked);
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
