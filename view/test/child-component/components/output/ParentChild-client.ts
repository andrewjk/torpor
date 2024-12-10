import $run from "../../../../src/render/$run";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function ParentChild(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument, t_fragments, 0, `<div> <!> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_comp_anchor_1 = t_anchor(t_next(t_child(t_div_1))) as HTMLElement;

	/* @component */
	const t_props_1 = {};
	t_props_1["name"] = "Anna";
	Child(t_div_1, t_comp_anchor_1, t_props_1, $context);
	t_add_fragment(t_fragment_0, $parent, $anchor);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument, t_fragments, 0, `<h2>#</h2>`);
	const t_h2_1 = t_root(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_h2_1);
	$run(function setTextContent() {
		t_text_1.textContent = `Hello, ${t_fmt($props.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
