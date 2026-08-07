import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ControlInSlot(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { name: string; visible: boolean }[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	const t_slots_1: Record<string, SlotRender> = {};
	t_slots_1["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `<!>`);
		const t_root_2 = t_root(t_fragment_2);
		let t_for_anchor_1 = t_anchor(t_root_2) as HTMLElement;

		/* @for */
		let t_for_region_1 = t_region();
		t_run_list(
			t_for_region_1,
			t_fragment_2,
			t_for_anchor_1,
			() => {
				let t_new_items_1: ListItemSpec[] = [];
				for (let item of $props.items) {
					t_new_items_1.push({ data: { item }, key:
					undefined });
				}
				return t_new_items_1;
			},
			(t_item_1, t_before_1) => {
				let t_old_region_1 = t_push_region(t_item_1);
				const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, `<!>`);
				const t_root_3 = t_root(t_fragment_3);
				let t_if_anchor_1 = t_anchor(t_root_3) as HTMLElement;

				/* @if */
				const t_if_region_1 = t_region();
				let t_if_index_1 = -1;
				t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
					if (t_item_1.data.item.visible) {
						if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
						const t_new_region = t_region();
						const t_old_region = t_push_region(t_new_region, true);
						const t_fragment_4 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 4, `<p>#</p>`);
						const t_root_4 = t_root_el(t_fragment_4);
						const t_p_1 = t_root_4 as HTMLElement;
						const t_text_1 = t_child(t_p_1);
						$run(() => {
							t_text_1.textContent = t_fmt(t_item_1.data.item.name);
						});
						t_add_element(t_p_1, t_fragment_3, t_before);
						t_next(t_p_1);
						t_pop_region(t_old_region);
						t_if_index_1 = 0;
					}
					else {
						if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
						t_if_index_1 = 1;
					}
				});

				t_add_fragment(t_fragment_3, t_fragment_2, t_before_1, t_if_anchor_1, t_root_3);
				t_next(t_if_anchor_1);
				t_pop_region(t_old_region_1);
			},
			(t_old_item, t_new_item) => {
				t_old_item.data.item = t_new_item.data.item;
			}
		);

		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_for_anchor_1, t_root_2);
		t_next(t_for_anchor_1);
	}
	Card(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_comp_anchor_1, t_root_0);
	t_next(t_comp_anchor_1);

}

function Card(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div class="card"><h2>Card title</h2> <!></div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	let t_slot_anchor_1 = t_anchor(t_next(t_next(t_child(t_div_1), true))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_div_1, t_slot_anchor_1, undefined, $context)
	}
	t_add_element(t_div_1, $parent, $anchor);
	t_next(t_div_1);

}
