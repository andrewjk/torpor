import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ParentChild(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		name: "Anna" as const,
	});
	Child(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_comp_anchor_1, t_root_0);
	t_next(t_comp_anchor_1);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<h2>#</h2>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_h2_1 = t_root_0 as HTMLElement;
	const t_text_1 = t_child(t_h2_1);
	$run(() => {
		t_text_1.textContent = `Hello, ${t_fmt($props.name)}`;
	});
	t_add_element(t_h2_1, $parent, $anchor);
	t_next(t_h2_1);

}
