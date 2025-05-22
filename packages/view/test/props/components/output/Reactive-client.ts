import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Reactive(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	let $state = $watch({ text: "before" })

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div> <button>Update text</button> <!> </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_button_1 = t_next(t_child(t_div_1)) as HTMLElement;
	const t_comp_anchor_1 = t_anchor(t_next(t_next(t_button_1))) as HTMLElement;

	/* @component */
	const t_props_1: any = $watch({});
	$run(function setProp() {
		t_props_1["text"] = $state.text;
	});
	Child(t_div_1, t_comp_anchor_1, t_props_1, $context);
	t_event(t_button_1, "click", () => $state.text = "after");
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_div_1);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p>`);
	// @ts-ignore
	const t_p_1 = t_root(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(function setTextContent() {
		t_text_1.textContent = ` ${t_fmt($props.text)} `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_p_1);

}
