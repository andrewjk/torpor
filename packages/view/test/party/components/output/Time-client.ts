import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Time(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	let $state = $watch({
		time: new Date().toLocaleTimeString()
	});

	$run(() => {
		const timer = setInterval(() => {
			$state.time = new Date().toLocaleTimeString();
		}, 1000);

		return () => clearInterval(timer);
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p>`);
	// @ts-ignore
	const t_p_1 = t_root(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(function setTextContent() {
		t_text_1.textContent = `Current time: ${t_fmt($state.time)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1);
	t_next(t_p_1);

}
