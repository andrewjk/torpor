import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import t_run_list from "../../../../src/render/runList";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForWithIfElse(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { tabs: string[]; activeTab: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<nav><!></nav> <p>#</p>`);
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
			let t_new_items_1: ListItem[] = [];
			let t_previous_item_1 = t_for_region_1;
			let t_next_item_1 = t_for_region_1.nextRegion;
			for (let tab of $props.tabs) {
				let t_new_item_1 = t_list_item(
					{ tab },
				);
				t_new_item_1.previousRegion = t_previous_item_1;
				t_previous_item_1.nextRegion = t_new_item_1;
				t_previous_item_1 = t_new_item_1;
				t_new_items_1.push(t_new_item_1);
			}
			t_for_region_1.nextRegion = t_next_item_1;
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			let t_old_region_1 = t_push_region(t_item_1);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			let t_if_anchor_1 = t_anchor(t_root(t_fragment_1)) as HTMLElement;

			/* @if */
			const t_if_region_1 = t_region();
			let t_if_index_1 = -1;
			t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
				if (t_item_1.data.tab === $props.activeTab) {
					if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<button class="active">#</button>`);
					const t_button_1 = t_root_el(t_fragment_2) as HTMLButtonElement;
					const t_text_1 = t_child(t_button_1);
					$run(() => {
						t_text_1.textContent = t_fmt(t_item_1.data.tab);
					});
					t_add_element(t_button_1, t_fragment_1, t_before);
					t_next(t_button_1);
					t_pop_region(t_old_region);
					t_if_index_1 = 0;
				}
				else {
					if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<button>#</button>`);
					const t_button_2 = t_root_el(t_fragment_3) as HTMLButtonElement;
					const t_text_2 = t_child(t_button_2);
					$run(() => {
						t_text_2.textContent = t_fmt(t_item_1.data.tab);
					});
					t_add_element(t_button_2, t_fragment_1, t_before);
					t_next(t_button_2);
					t_pop_region(t_old_region);
					t_if_index_1 = 1;
				}
			});

			t_add_fragment(t_fragment_1, t_for_parent_1, t_before_1);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.tab = t_new_item.data.tab;
		}
	);

	const t_p_1 = t_next(t_next(t_for_parent_1, true)) as HTMLElement;
	const t_text_3 = t_child(t_p_1);
	$run(() => {
		t_text_3.textContent = `Active: ${t_fmt($props.activeTab)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1);
	t_next(t_p_1);

}
