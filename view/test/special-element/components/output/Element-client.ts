import $run from "../../../../src/render/$run";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_dynamic from "../../../../src/render/setDynamicElement";
import t_fragment from "../../../../src/render/getFragment";
import t_root from "../../../../src/render/nodeRoot";

export default function Element(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_element_1 = t_root_0 as HTMLElement;
	$run(function setDynamic() {
		t_element_1 = t_dynamic(t_element_1, $props.tag);
		const t_fragment_1 = t_fragment(t_fragments, 1, ` Hello! `);
		let t_element_2 = t_root(t_fragment_1) as HTMLElement;
		t_add_fragment(t_fragment_1, t_element_1, null);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
