import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
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
): void {

	let $state = $watch({ counter: 0 })

	function increment(_: Event, num?: number) {
		$state.counter += num || 1;
	}

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <button id="increment"> Increment </button> <button id="increment5"> Increment </button> <p>#</p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_button_1 = t_next(t_root_0) as HTMLButtonElement;
	const t_button_2 = t_next(t_next(t_button_1, true)) as HTMLButtonElement;
	const t_text_1 = t_child(t_next(t_next(t_button_2, true)));
	const t_text_2 = t_next(t_next(t_next(t_button_2, true)), true);
	t_event(t_button_1, "click", increment);
	t_event(t_button_2, "click", (e) => increment(e, 5));
	$run(() => {
		t_text_1.textContent = ` The count is ${t_fmt($state.counter)}. `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
