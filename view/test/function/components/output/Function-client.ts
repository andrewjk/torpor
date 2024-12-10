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

export default function Function(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	let $state = $watch({ counter: 0 })

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument, t_fragments, 0, `<div> <button id=increment>Increment</button> <p>#</p> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_button_1 = t_next(t_child(t_div_1)) as HTMLElement;
	const t_text_1 = t_child(t_next(t_next(t_button_1)));
	t_event(t_button_1, "click", increment);

	/* @function */
	function increment() {
		$state.counter += 1;
	};

	$run(function setTextContent() {
		t_text_1.textContent = ` The count is ${t_fmt($state.counter)}. `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
