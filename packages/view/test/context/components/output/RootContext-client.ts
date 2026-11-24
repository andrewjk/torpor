import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {
	$context = Object.assign({}, $context);

	// Destructuring keeps the object, so reads through it stay reactive
	let { $app } = $context;

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<p>#</p>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_p_1 = t_root_0 as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = `${t_fmt($app.name)} / ${t_fmt($context.$app.count)}`;
	});
	t_add_element(t_p_1, $parent, $anchor);

}

export default function RootContext(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<section><!></section>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_section_1 = t_root_0 as HTMLElement;
	let t_comp_anchor_1 = t_anchor(t_child(t_section_1)) as HTMLElement;

	/* @component */
	Child(t_section_1, t_comp_anchor_1, undefined, $context);

	t_add_element(t_section_1, $parent, $anchor);

}
