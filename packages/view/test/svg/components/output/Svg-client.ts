import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_class from "../../../../src/render/buildClasses";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Shape(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img"><!></svg>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_svg_1 = t_root_0 as SVGElement;
	let t_if_anchor_1 = t_anchor(t_child(t_svg_1)) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.name === "rect") {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<rect width="100" height="100" fill="red"></rect>`, true);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_rect_1 = t_root_1 as SVGRectElement;
			t_add_element(t_rect_1, t_svg_1, t_before);
			t_next(t_rect_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<circle r="45" cx="50" cy="50" fill="red"></circle>`, true);
			const t_root_2 = t_root_el(t_fragment_2);
			const t_circle_1 = t_root_2 as HTMLElement;
			t_add_element(t_circle_1, t_svg_1, t_before);
			t_next(t_circle_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
	});

	$run(() => {
		// @ts-ignore
		t_svg_1.className.baseVal = t_class({ "svg-cls": true });
	});
	t_add_element(t_svg_1, $parent, $anchor);
	t_next(t_svg_1);

}
