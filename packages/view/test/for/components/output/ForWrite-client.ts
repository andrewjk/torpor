import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForWrite(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { rows: Props["rows"] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<ul><!></ul>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_ul_1 = t_root_0 as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_ul_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_ul_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let row of $props.rows) {
				t_new_items_1.push({ data: { row }, key:
				row.id });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<li data-testid=""><input type="checkbox">#</li>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_li_1 = t_root_1 as HTMLElement;
			const t_input_1 = t_child(t_li_1) as HTMLInputElement;
			const t_text_1 = t_next(t_input_1, true);
			$run(() => {
				const row = t_item_1.data.row;
				t_input_1.checked = row.done || false;
			}, undefined, { forVarMask: 1 });
			t_event(t_input_1, "input", (e) => {
				const row = t_item_1.data.row;
				return row.done = e.target.checked
			});
			$run(() => {
				const row = t_item_1.data.row;
				t_attribute(t_li_1, "data-testid", row.label);
				t_text_1.textContent = ` ${t_fmt(row.done ? "done" : "todo")}:${t_fmt(row.label)} `;
			}, undefined, { forVarMask: 1 });
			t_add_element(t_li_1, t_ul_1, t_before_1);
			t_next(t_li_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.row = t_new_item.data.row;
		}
	);

	t_add_element(t_ul_1, $parent, $anchor);
	t_next(t_ul_1);

}
