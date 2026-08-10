import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ArrayIndexes(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<section><p>^</p> <!> <p>$</p></section>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_section_1 = t_root_0 as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_next(t_next(t_child(t_section_1), true))) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_section_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let i = 0; i < $props.items.length; i++) {
				t_new_items_1.push({ data: i, key:
				$props.items[i].id });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<span>#</span>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_span_1 = t_root_1 as HTMLSpanElement;
			const t_text_1 = t_child(t_span_1);
			$run(() => {
				t_text_1.textContent = ` ${t_fmt(t_item_1.data > 0 ? ", " : "")} ${t_fmt($props.items[t_item_1.data].text)} `;
			});
			t_add_element(t_span_1, t_section_1, t_before_1);
			t_next(t_span_1);
		},
		(t_old_item, t_new_item) => {
			let t_changed = false;
			if (t_old_item.data !== t_new_item.data) {
				t_old_item.data = t_new_item.data;
				t_changed = true;
			}
			if (t_changed) t_rerun_region_effects(t_old_item);
		},
		true
	);

	t_add_element(t_section_1, $parent, $anchor);
	t_next(t_section_1);

}
