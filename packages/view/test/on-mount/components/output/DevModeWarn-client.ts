import $onmount from "../../../../src/watch/$onmount";
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

export default function OnmountOnce(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ count: 0 })

	$onmount(() => {
		// @ts-ignore
		window.__log.push("onmount:" + $state.count)
	})

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p> <button id="inc">+</button>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_button_1 = t_next(t_next(t_root_0, true)) as HTMLButtonElement;

	/* @function */
	function increment() {
		$state.count += 1
	};

	t_event(t_button_1, "click", increment);
	$run(() => {
		t_text_1.textContent = `Count: ${t_fmt($state.count)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_button_1, t_root_0);
	t_next(t_button_1);

}
