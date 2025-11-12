import $peek from "../../../../src/watch/$peek";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_clear from "../../../../src/render/clearRegion";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_control from "../../../../src/render/runControl";

export default function NestedIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { condition: boolean, counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_if_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.condition) {
			if (t_if_index_1 === 0) return;
			if (t_if_region_1.depth === -2) return;
			if (t_if_region_1.nextRegion !== null && t_if_region_1.nextRegion.depth > t_if_region_1.depth) {
				t_clear(t_if_region_1.nextRegion);
			}
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <!> `);
			const t_root_1 = t_root(t_fragment_1, true);
			let t_if_anchor_2 = t_anchor(t_next(t_root_1)) as HTMLElement;

			/* @if */
			const t_if_region_2 = t_region();
			let t_if_index_2 = -1;
			t_run_control(t_if_region_2, t_if_anchor_2, (t_before) => {
				if ($props.counter > 5) {
					if (t_if_index_2 === 0) return;
					if (t_if_region_2.depth === -2) return;
					if (t_if_region_2.nextRegion !== null && t_if_region_2.nextRegion.depth > t_if_region_2.depth) {
						t_clear(t_if_region_2.nextRegion);
					}
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p>It's big</p> `);
					const t_root_2 = t_root(t_fragment_2, true);
					const t_text_1 = t_next(t_next(t_root_2), true);
					t_add_fragment(t_fragment_2, t_fragment_1, t_before, t_text_1);
					t_next(t_text_1);
					t_pop_region(t_old_region);
					t_if_index_2 = 0;
				}
				else {
					if (t_if_index_2 === 1) return;
					if (t_if_region_2.depth === -2) return;
					if (t_if_region_2.nextRegion !== null && t_if_region_2.nextRegion.depth > t_if_region_2.depth) {
						t_clear(t_if_region_2.nextRegion);
					}
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <p>It's small</p> `);
					const t_root_3 = t_root(t_fragment_3, true);
					const t_text_2 = t_next(t_next(t_root_3), true);
					t_add_fragment(t_fragment_3, t_fragment_1, t_before, t_text_2);
					t_next(t_text_2);
					t_pop_region(t_old_region);
					t_if_index_2 = 1;
				}
			});

			const t_text_3 = t_next(t_if_anchor_2, true);
			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_3);
			t_next(t_text_3);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (t_if_index_1 === 1) return;
			if (t_if_region_1.depth === -2) return;
			if (t_if_region_1.nextRegion !== null && t_if_region_1.nextRegion.depth > t_if_region_1.depth) {
				t_clear(t_if_region_1.nextRegion);
			}
			t_if_index_1 = 1;
		}
	});

	const t_text_4 = t_next(t_if_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

	/**/ });
}
