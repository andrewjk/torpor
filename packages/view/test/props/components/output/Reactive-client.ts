import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Reactive(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ text: "before" })

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<button>Update text</button> <!>`);
	const t_button_1 = t_root(t_fragment_0) as HTMLButtonElement;
	let t_comp_anchor_1 = t_anchor(t_next(t_next(t_button_1, true))) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		text: $state.text,
	});
	$run(() => {
		t_props_1["text"] = $state.text;
	});
	Child(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	t_event(t_button_1, "click", () => $state.text = "after");
	t_add_fragment(t_fragment_0, $parent, $anchor, t_button_1);
	t_next(t_button_1);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<p>#</p>`);
	const t_p_1 = t_root_el(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = ` ${t_fmt($props.text)} `;
	});
	t_add_element(t_p_1, $parent, $anchor);
	t_next(t_p_1);

}
