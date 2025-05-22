import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_dynamic from "../../../../src/render/setDynamicElement";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Element(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0);
	let t_element_1 = t_root_0 as HTMLElement;
	$run(function setDynamic() {
		t_element_1 = t_dynamic(t_element_1, $props.tag);
		const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` Hello! `);
		let t_element_2 = t_root(t_fragment_1) as HTMLElement;
		t_add_fragment(t_fragment_1, t_element_1, null);
		t_next(t_element_2);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_element_1);

}
