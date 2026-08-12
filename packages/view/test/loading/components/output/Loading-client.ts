import { $await } from "@torpor/view";
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
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import { t_run_loading } from "@torpor/view";
import type SlotRender from "../../../../src/types/SlotRender";

export default function LoadingTest(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		version: 0,
		get data() {
			return $await(
				() =>
				new Promise((resolve) => {
					setTimeout(() => resolve("loaded v" + $state.version), 10);
				}),
			);
		},
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_loading_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @loading */
	const t_loading_region_1 = t_region();
	t_run_loading(t_loading_region_1, t_loading_anchor_1, (t_before) => {
		const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>#</p>`);
		const t_root_1 = t_root_el(t_fragment_1);
		const t_p_1 = t_root_1 as HTMLElement;
		const t_text_1 = t_child(t_p_1);
		$run(() => {
			t_text_1.textContent = `Result: ${t_fmt($state.data)}`;
		});
		t_add_element(t_p_1, t_fragment_0, t_before);
		t_next(t_p_1);
	}, (t_before) => {
		const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>Loading...</p>`);
		const t_root_2 = t_root_el(t_fragment_2);
		const t_p_2 = t_root_2 as HTMLElement;
		t_add_element(t_p_2, t_fragment_0, t_before);
		t_next(t_p_2);
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_loading_anchor_1, t_root_0);
	t_next(t_loading_anchor_1);

}
