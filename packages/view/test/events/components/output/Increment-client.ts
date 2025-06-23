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

export default function Increment(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	const $state = $watch({ counter: 0 })

	function increment(e, num) {
		$state.counter += num || 1;
	}

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div> <button id="increment"> Increment </button> <button id="increment5"> Increment </button> <p>#</p> </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_button_1 = t_next(t_child(t_div_1)) as HTMLElement;
	const t_button_2 = t_next(t_button_1, 2) as HTMLElement;
	const t_text_1 = t_child(t_next(t_button_2, 2));
	t_event(t_button_1, "click", increment);
	t_event(t_button_2, "click", (e) => increment(e, 5));
	$run(function setTextContent() {
		t_text_1.textContent = ` The count is ${t_fmt($state.counter)}. `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_div_1);
	t_next(t_div_1);

}
