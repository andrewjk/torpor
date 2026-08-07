import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function IsAvailable(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		isAvailable: false
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div>#</div> <input id="is-available" type="checkbox"> <label for="is-available">Is available</label>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_input_1 = t_next(t_next(t_root_0, true)) as HTMLInputElement;
	const t_label_1 = t_next(t_next(t_input_1, true)) as HTMLElement;
	$run(() => {
		t_input_1.checked = $state.isAvailable || false;
	});
	t_event(t_input_1, "input", (e) => $state.isAvailable = e.target.checked);
	$run(() => {
		t_text_1.textContent = t_fmt($state.isAvailable ? "Available" : "Not available");
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_label_1, t_root_0);
	t_next(t_label_1);

}
