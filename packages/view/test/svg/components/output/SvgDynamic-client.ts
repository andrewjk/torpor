import t_add_element from "../../../../src/render/addElement";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function SvgDynamic(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { type: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<svg viewBox="0 0 100 100" role="img"><!></svg>`);
	const t_svg_1 = t_root_el(t_fragment_0) as SVGElement;
	let t_if_anchor_1 = t_anchor(t_child(t_svg_1)) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.type === "circle") {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<circle cx="50" cy="50" r="40" fill="blue"></circle>`, true);
			const t_circle_1 = t_root_el(t_fragment_1) as HTMLElement;
			t_add_element(t_circle_1, t_svg_1, t_before);
			t_next(t_circle_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else if ($props.type === "rect") {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<rect x="10" y="10" width="80" height="80" fill="green"></rect>`, true);
			const t_rect_1 = t_root_el(t_fragment_2) as SVGRectElement;
			t_add_element(t_rect_1, t_svg_1, t_before);
			t_next(t_rect_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 2)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<polygon points="50,10 90,90 10,90" fill="red"></polygon>`, true);
			const t_polygon_1 = t_root_el(t_fragment_3) as HTMLElement;
			t_add_element(t_polygon_1, t_svg_1, t_before);
			t_next(t_polygon_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 2;
		}
	});

	t_add_element(t_svg_1, $parent, $anchor);
	t_next(t_svg_1);

}
