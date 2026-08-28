import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForTemplateLiteral(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { slides: { index: number }[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<section><!></section>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_section_1 = t_root_0 as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_section_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_section_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let slide of $props.slides) {
				t_new_items_1.push({ data: slide, key:
				undefined });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<p>Slide</p> <p>Constant</p>`);
			const t_root_1 = t_root(t_fragment_1);
			const t_p_1 = t_root_1 as HTMLElement;
			const t_p_2 = t_next(t_next(t_p_1, true)) as HTMLElement;
			$run(() => {
				t_attribute(t_p_1, "aria-label", `Go to t_item_1.data ${t_item_1.data.index + 1}`);
				t_attribute(t_p_2, "aria-label", `slide show`);
			}, undefined, { forVarMask: 1 });
			t_add_fragment(t_fragment_1, t_section_1, t_before_1, t_p_2, t_root_1);
			t_next(t_p_2);
		},
		(t_old_item, t_new_item) => {
			let t_changed_mask = 0;
			if (t_old_item.data !== t_new_item.data) {
				t_old_item.data = t_new_item.data;
				t_changed_mask = 1;
			}
			if (t_changed_mask) t_rerun_region_effects(t_old_item, t_changed_mask);
		},
		true
	);

	t_add_element(t_section_1, $parent, $anchor);
	t_next(t_section_1);

}
