import $peek from "../../../../src/watch/$peek";
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

export default function InputHello(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	let $state = $watch({
		text: "Hello World"
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>#</p> <input></input> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_input_1 = t_next(t_next(t_next(t_root_0), true)) as HTMLInputElement;
	const t_text_2 = t_next(t_input_1, true);
	$run(() => {
		t_input_1.value = $state.text || "";
	});
	t_event(t_input_1, "input", (e) => $state.text = e.target.value);
	$run(() => {
		t_text_1.textContent = t_fmt($state.text);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

	/**/ });
}
