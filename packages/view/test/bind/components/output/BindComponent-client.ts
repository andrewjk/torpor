import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function BindComponent(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props:  Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	let $state = $watch({ name: "Alice", selected: 1 });

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> <p>#</p> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @component */
	const t_props_1: any = $watch({});
	$run(function setProp() {
		t_props_1["name"] = $state.name;
	});
	$run(function setBinding() {
		$state.name = t_props_1["name"];
	});
	BindText(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	const t_text_1 = t_child(t_next(t_next(t_comp_anchor_1, true)));
	// @ts-ignore
	const t_text_2 = t_next(t_next(t_next(t_comp_anchor_1, true)), true);
	$run(function setAttributes() {
		t_text_1.textContent = `Hello, ${t_fmt($state.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}

function BindText(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <input></input> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_input_1 = t_next(t_root_0) as HTMLInputElement;
	// @ts-ignore
	const t_text_1 = t_next(t_input_1, true);
	$run(function setBinding() {
		t_input_1.value = $props.name || "";
	});
	t_event(t_input_1, "input", (e) => $props.name = e.target.value);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
