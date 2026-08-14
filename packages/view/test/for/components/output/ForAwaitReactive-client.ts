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
import { t_run_await } from "@torpor/view";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForAwaitReactive(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { ids: number[]; loaded: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<ul><!></ul> <footer>after</footer>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_for_parent_1 = t_root_0 as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_for_parent_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_for_parent_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let id of $props.ids) {
				t_new_items_1.push({ data: { id }, key:
				id });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			let t_old_region_1 = t_push_region(t_item_1);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			const t_root_1 = t_root(t_fragment_1);
			let t_await_anchor_1 = t_anchor(t_root_1) as HTMLElement;

			/* @await */
			const t_await_region_1 = t_region();
			t_run_await(t_await_region_1, t_await_anchor_1, (t_before) => {
				const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<li class="ok">#</li>`);
				const t_root_2 = t_root_el(t_fragment_2);
				const t_li_1 = t_root_2 as HTMLElement;
				const t_text_1 = t_child(t_li_1);
				$run(() => {
					t_text_1.textContent = `${t_fmt(t_item_1.data.id)} ${t_fmt($props.loaded)}`;
				}, undefined, { forVarMask: 1 });
				t_add_element(t_li_1, t_fragment_1, t_before);
				t_next(t_li_1);
			}, (t_before) => {
				const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<li class="loading">#</li>`);
				const t_root_3 = t_root_el(t_fragment_3);
				const t_li_2 = t_root_3 as HTMLElement;
				const t_text_2 = t_child(t_li_2);
				$run(() => {
					t_text_2.textContent = `${t_fmt(t_item_1.data.id)} loading`;
				}, undefined, { forVarMask: 1 });
				t_add_element(t_li_2, t_fragment_1, t_before);
				t_next(t_li_2);
			});

			t_add_fragment(t_fragment_1, t_for_parent_1, t_before_1, t_await_anchor_1, t_root_1);
			t_next(t_await_anchor_1);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.id = t_new_item.data.id;
		}
	);

	const t_footer_1 = t_next(t_next(t_for_parent_1, true)) as HTMLElement;
	t_add_fragment(t_fragment_0, $parent, $anchor, t_footer_1, t_root_0);
	t_next(t_footer_1);

}
