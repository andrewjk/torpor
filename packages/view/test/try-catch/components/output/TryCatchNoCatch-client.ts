import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_try from "../../../../src/render/runTry";
import type SlotRender from "../../../../src/types/SlotRender";

export default function TryNoCatch(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_try_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @try */
	const t_try_region_1 = t_region();
	t_run_try(t_try_region_1, t_try_anchor_1, (t_before) => {
		const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>Fine</p>`);
		const t_root_1 = t_root_el(t_fragment_1);
		const t_p_1 = t_root_1 as HTMLElement;
		t_add_element(t_p_1, t_fragment_0, t_before);
	}, null);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_try_anchor_1, t_root_0);

}
