import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import { t_spread } from "@torpor/view";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function SpreadElement(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { attrs: Record<string, any> }[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		attrs: {
			"data-one": "1",
			title: "hello",
			disabled: false,
			onclick: () => {
				$state.clicks = $state.clicks + 1;
			},
		} as Record<string, any>,
		clicks: 0,
	})

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div data-testid="target"><p>Content</p></div> <span data-testid="clicks">#</span> <button data-testid="swap"> Swap </button> <ul><!></ul>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_next(t_div_1, true)));
	const t_button_1 = t_next(t_next(t_next(t_next(t_div_1, true)), true)) as HTMLButtonElement;
	const t_ul_1 = t_next(t_next(t_button_1, true)) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_ul_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_ul_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let item of $props.items) {
				t_new_items_1.push({ data: item, key:
				undefined });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<li>#</li>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_li_1 = t_root_1 as HTMLElement;
			const t_text_2 = t_child(t_li_1);
			$run(() => {
				t_spread(t_li_1, t_item_1.data.attrs, 0)
				t_text_2.textContent = t_fmt(t_item_1.data.attrs["data-name"]);
			}, undefined, { forVarMask: 1 });
			t_add_element(t_li_1, t_ul_1, t_before_1);
			t_next(t_li_1);
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

	t_event(t_button_1, "click", () => { $state.attrs = { "data-two": "2" } });
	$run(() => {
		t_spread(t_div_1, $state.attrs, 1)
		t_text_1.textContent = t_fmt($state.clicks);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_ul_1, t_root_0);
	t_next(t_ul_1);

}
