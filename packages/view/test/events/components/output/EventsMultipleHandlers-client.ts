import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_root from "../../../../src/render/nodeRoot";
import t_skip from "../../../../src/render/nodeSkip";
import type SlotRender from "../../../../src/types/SlotRender";

export default function EventsMultiple(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ count: 0, lastAction: "" });

	function handleClick() {
		$state.count += 1;
		$state.lastAction = "clicked";
	}

	function handleDblClick() {
		$state.count += 10;
		$state.lastAction = "double-clicked";
	}

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<button id="single">Single Click</button> <button id="double">Double Click</button> <p>#</p> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_button_1 = t_root_0 as HTMLButtonElement;
	const t_button_2 = t_skip(t_button_1, 2, 1) as HTMLButtonElement;
	const t_text_1 = t_child(t_skip(t_button_2, 2, 1));
	const t_p_1 = t_skip(t_button_2, 4, 5) as HTMLElement;
	const t_text_2 = t_child(t_p_1);
	t_event(t_button_1, "click", handleClick);
	t_event(t_button_2, "dblclick", handleDblClick);
	$run(() => {
		t_text_1.textContent = `Count: ${t_fmt($state.count)}`;
		t_text_2.textContent = `Last: ${t_fmt($state.lastAction)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);

}
