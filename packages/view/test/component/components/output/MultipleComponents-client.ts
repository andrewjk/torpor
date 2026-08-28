import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function MultiComponent(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { label: string },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ count: 1 });

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div><p>#</p> <!></div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	const t_text_1 = t_child(t_child(t_div_1));
	let t_comp_anchor_1 = t_anchor(t_next(t_next(t_child(t_div_1), true))) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		label: $props.label,
	});
	$run(() => {
		t_props_1["label"] = $props.label;
	});
	Inner(t_div_1, t_comp_anchor_1, t_props_1, $context);

	$run(() => {
		t_text_1.textContent = `outer ${t_fmt($state.count)}`;
	});
	t_add_element(t_div_1, $parent, $anchor);
	t_next(t_div_1);

}

interface InnerProps {
	label: string;
}

/**
 * The inner component, in the same file.
 */
function Inner(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: InnerProps,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<span>#</span>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_span_1 = t_root_0 as HTMLSpanElement;
	const t_text_1 = t_child(t_span_1);
	$run(() => {
		t_text_1.textContent = `inner ${t_fmt($props.label)}`;
	});
	t_add_element(t_span_1, $parent, $anchor);
	t_next(t_span_1);

}
