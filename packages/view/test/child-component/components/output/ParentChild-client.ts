import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
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
	_$props:  Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @component */
	const t_props_1: any = $watch({});
	t_props_1["name"] = "Anna";
	Child(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	const t_text_1 = t_next(t_comp_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <h2>#</h2> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_text_2 = t_next(t_next(t_root_0), true);
	$run(function setAttributes() {
		t_text_1.textContent = `Hello, ${t_fmt($props.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
