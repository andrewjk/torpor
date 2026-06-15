import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import t_run_list from "../../../../src/render/runList";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";

export default function AdjacentIfsFor(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean; c: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> <!> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_if_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.a) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>A</p> `);
			const t_root_1 = t_root(t_fragment_1, true);
			const t_text_1 = t_next(t_next(t_root_1), true);
			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_1);
			t_next(t_text_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			t_if_index_1 = 1;
		}
	});

	let t_if_anchor_2 = t_anchor(t_next(t_next(t_if_anchor_1, true))) as HTMLElement;

	/* @if */
	const t_if_region_2 = t_region();
	let t_if_index_2 = -1;
	t_run_control(t_if_region_2, t_if_anchor_2, (t_before) => {
		if ($props.b) {
			if (!t_run_branch(t_if_region_2, t_if_index_2, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <ul> <!> </ul> `);
			const t_root_2 = t_root(t_fragment_2, true);
			const t_for_parent_1 = t_next(t_root_2) as HTMLElement;
			let t_for_anchor_1 = t_anchor(t_next(t_child(t_for_parent_1))) as HTMLElement;

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
					for (let i = 0; i < 3; i++) {
						let t_new_item_1 = t_list_item(
							{ i },
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
					const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <li>#</li> `);
					const t_root_3 = t_root(t_fragment_3, true);
					const t_text_2 = t_child(t_next(t_root_3));
					const t_text_3 = t_next(t_next(t_root_3), true);
					$run(() => {
						t_text_2.textContent = `B${t_fmt(t_item_1.data.i)}`;
					});
					t_add_fragment(t_fragment_3, t_for_parent_1, t_before_1, t_text_3);
					t_next(t_text_3);
					t_pop_region(t_old_region_1);
				},
				(t_old_item, t_new_item) => {
					t_old_item.data.i = t_new_item.data.i;
				}
			);

			const t_text_4 = t_next(t_for_parent_1, true);
			t_add_fragment(t_fragment_2, t_fragment_0, t_before, t_text_4);
			t_next(t_text_4);
			t_pop_region(t_old_region);
			t_if_index_2 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_2, t_if_index_2, 1)) return;
			t_if_index_2 = 1;
		}
	});

	let t_if_anchor_3 = t_anchor(t_next(t_next(t_if_anchor_2, true))) as HTMLElement;

	/* @if */
	const t_if_region_3 = t_region();
	let t_if_index_3 = -1;
	t_run_control(t_if_region_3, t_if_anchor_3, (t_before) => {
		if ($props.c) {
			if (!t_run_branch(t_if_region_3, t_if_index_3, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_4 = t_fragment($parent.ownerDocument!, t_fragments, 4, ` <!> `);
			const t_root_4 = t_root(t_fragment_4, true);
			let t_switch_anchor_1 = t_anchor(t_next(t_root_4)) as HTMLElement;

			/* @switch */
			const t_switch_region_1 = t_region();
			let t_switch_index_1 = -1;
			t_run_control(t_switch_region_1, t_switch_anchor_1, (t_before) => {
				switch (1) {
					case 1: {
						if (!t_run_branch(t_switch_region_1, t_switch_index_1, 0)) return;
						const t_new_region = t_region();
						const t_old_region = t_push_region(t_new_region, true);
						const t_fragment_5 = t_fragment($parent.ownerDocument!, t_fragments, 5, ` <p>C-on</p> `);
						const t_root_5 = t_root(t_fragment_5, true);
						const t_text_5 = t_next(t_next(t_root_5), true);
						t_add_fragment(t_fragment_5, t_fragment_4, t_before, t_text_5);
						t_next(t_text_5);
						t_pop_region(t_old_region);
						t_switch_index_1 = 0;
						break;
					}
					default: {
						if (!t_run_branch(t_switch_region_1, t_switch_index_1, 1)) return;
						t_switch_index_1 = 1;
						break;
					}
				}
			});

			const t_text_6 = t_next(t_switch_anchor_1, true);
			t_add_fragment(t_fragment_4, t_fragment_0, t_before, t_text_6);
			t_next(t_text_6);
			t_pop_region(t_old_region);
			t_if_index_3 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_3, t_if_index_3, 1)) return;
			t_if_index_3 = 1;
		}
	});

	const t_text_7 = t_next(t_if_anchor_3, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_7);
	t_next(t_text_7);

}
