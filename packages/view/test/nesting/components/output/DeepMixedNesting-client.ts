import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function DeepMixed(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean; c: boolean; d: boolean; e: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> <!> `);
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
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>Level 1</p> <!> `);
			const t_root_1 = t_root(t_fragment_1, true);
			let t_if_anchor_2 = t_anchor(t_next(t_next(t_next(t_root_1), true))) as HTMLElement;

			/* @if */
			const t_if_region_2 = t_region();
			let t_if_index_2 = -1;
			t_run_control(t_if_region_2, t_if_anchor_2, (t_before) => {
				if ($props.b) {
					if (!t_run_branch(t_if_region_2, t_if_index_2, 0)) return;
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p>Level 2</p> <!> `);
					const t_root_2 = t_root(t_fragment_2, true);
					let t_if_anchor_3 = t_anchor(t_next(t_next(t_next(t_root_2), true))) as HTMLElement;

					/* @if */
					const t_if_region_3 = t_region();
					let t_if_index_3 = -1;
					t_run_control(t_if_region_3, t_if_anchor_3, (t_before) => {
						if ($props.c) {
							if (!t_run_branch(t_if_region_3, t_if_index_3, 0)) return;
							const t_new_region = t_region();
							const t_old_region = t_push_region(t_new_region, true);
							const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <p>Level 3</p> <!> `);
							const t_root_3 = t_root(t_fragment_3, true);
							let t_if_anchor_4 = t_anchor(t_next(t_next(t_next(t_root_3), true))) as HTMLElement;

							/* @if */
							const t_if_region_4 = t_region();
							let t_if_index_4 = -1;
							t_run_control(t_if_region_4, t_if_anchor_4, (t_before) => {
								if ($props.d) {
									if (!t_run_branch(t_if_region_4, t_if_index_4, 0)) return;
									const t_new_region = t_region();
									const t_old_region = t_push_region(t_new_region, true);
									const t_fragment_4 = t_fragment($parent.ownerDocument!, t_fragments, 4, ` <p>Level 4</p> <!> `);
									const t_root_4 = t_root(t_fragment_4, true);
									let t_if_anchor_5 = t_anchor(t_next(t_next(t_next(t_root_4), true))) as HTMLElement;

									/* @if */
									const t_if_region_5 = t_region();
									let t_if_index_5 = -1;
									t_run_control(t_if_region_5, t_if_anchor_5, (t_before) => {
										if ($props.e) {
											if (!t_run_branch(t_if_region_5, t_if_index_5, 0)) return;
											const t_new_region = t_region();
											const t_old_region = t_push_region(t_new_region, true);
											const t_fragment_5 = t_fragment($parent.ownerDocument!, t_fragments, 5, ` <p>Level 5</p> `);
											const t_root_5 = t_root(t_fragment_5, true);
											const t_text_1 = t_next(t_next(t_root_5), true);
											t_add_fragment(t_fragment_5, t_fragment_4, t_before, t_text_1);
											t_next(t_text_1);
											t_pop_region(t_old_region);
											t_if_index_5 = 0;
										}
										else {
											if (!t_run_branch(t_if_region_5, t_if_index_5, 1)) return;
											t_if_index_5 = 1;
										}
									});

									const t_text_2 = t_next(t_if_anchor_5, true);
									t_add_fragment(t_fragment_4, t_fragment_3, t_before, t_text_2);
									t_next(t_text_2);
									t_pop_region(t_old_region);
									t_if_index_4 = 0;
								}
								else {
									if (!t_run_branch(t_if_region_4, t_if_index_4, 1)) return;
									t_if_index_4 = 1;
								}
							});

							const t_text_3 = t_next(t_if_anchor_4, true);
							t_add_fragment(t_fragment_3, t_fragment_2, t_before, t_text_3);
							t_next(t_text_3);
							t_pop_region(t_old_region);
							t_if_index_3 = 0;
						}
						else {
							if (!t_run_branch(t_if_region_3, t_if_index_3, 1)) return;
							t_if_index_3 = 1;
						}
					});

					const t_text_4 = t_next(t_if_anchor_3, true);
					t_add_fragment(t_fragment_2, t_fragment_1, t_before, t_text_4);
					t_next(t_text_4);
					t_pop_region(t_old_region);
					t_if_index_2 = 0;
				}
				else {
					if (!t_run_branch(t_if_region_2, t_if_index_2, 1)) return;
					t_if_index_2 = 1;
				}
			});

			const t_text_5 = t_next(t_if_anchor_2, true);
			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_5);
			t_next(t_text_5);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			t_if_index_1 = 1;
		}
	});

	let t_if_anchor_6 = t_anchor(t_next(t_next(t_if_anchor_1, true))) as HTMLElement;

	/* @if */
	const t_if_region_6 = t_region();
	let t_if_index_6 = -1;
	t_run_control(t_if_region_6, t_if_anchor_6, (t_before) => {
		if ($props.a && $props.e) {
			if (!t_run_branch(t_if_region_6, t_if_index_6, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_6 = t_fragment($parent.ownerDocument!, t_fragments, 6, ` <p>A+E</p> `);
			const t_root_6 = t_root(t_fragment_6, true);
			const t_text_6 = t_next(t_next(t_root_6), true);
			t_add_fragment(t_fragment_6, t_fragment_0, t_before, t_text_6);
			t_next(t_text_6);
			t_pop_region(t_old_region);
			t_if_index_6 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_6, t_if_index_6, 1)) return;
			t_if_index_6 = 1;
		}
	});

	const t_text_7 = t_next(t_if_anchor_6, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_7);
	t_next(t_text_7);

}
