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

export default function Counter(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props:  Record<PropertyKey, any> | undefined,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	let $state = $watch({
		count: 0
	});

	function incrementCount() {
		$state.count++;
	}

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>#</p> <button>+1</button> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_button_1 = t_next(t_next(t_next(t_root_0), true)) as HTMLElement;
	// @ts-ignore
	const t_text_2 = t_next(t_button_1, true);
	t_event(t_button_1, "click",
	incrementCount
);
$run(function setAttributes() {
	t_text_1.textContent = `Counter: ${t_fmt($state.count)}`;
});
t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
t_next(t_text_2);

}
