import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForEscape(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let things = ["a", "b", "c", "d", "e"]

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
			for (let i = 0; i < 5; i++) {
				t_new_items_1.push({ data: { i }, key:
				undefined });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<p>#</p> <div data-testid=""></div> <div data-testid=""></div> <div data-testid=""></div> <input>`);
			const t_root_1 = t_root(t_fragment_1);
			const t_text_1 = t_child(t_root_1);
			const t_div_1 = t_next(t_next(t_root_1, true)) as HTMLDivElement;
			const t_div_2 = t_next(t_next(t_div_1, true)) as HTMLDivElement;
			const t_div_3 = t_next(t_next(t_div_2, true)) as HTMLDivElement;
			const t_input_1 = t_next(t_next(t_div_3, true)) as HTMLInputElement;
			$run(() => {
				t_input_1.value = t_item_1.data.i || "";
			});
			t_event(t_input_1, "input", (e) => t_item_1.data.i = e.target.value);
			$run(() => {
				t_text_1.textContent = t_fmt(t_item_1.data.i);
				t_attribute(t_div_1, "data-testid", `input1-${t_item_1.data.i}`);
				t_attribute(t_div_1, "name", t_item_1.data.i);
				t_attribute(t_div_2, "data-testid", `input2-${t_item_1.data.i}`);
				t_attribute(t_div_2, "name", `${t_item_1.data.i}`);
				t_attribute(t_div_3, "data-testid", `input3-${t_item_1.data.i}`);
				t_attribute(t_div_3, "name", things[t_item_1.data.i]);
				t_attribute(t_input_1, "name", `${t_item_1.data.i}`);
			});
			t_add_fragment(t_fragment_1, t_section_1, t_before_1, t_input_1, t_root_1);
			t_next(t_input_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.i = t_new_item.data.i;
		}
	);

	t_add_element(t_section_1, $parent, $anchor);
	t_next(t_section_1);

}
