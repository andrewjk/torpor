import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_clear from "../../../../src/render/clearRegion";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_control from "../../../../src/render/runControl";

export default function Self(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { level: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>#</p> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	let t_if_anchor_1 = t_anchor(t_next(t_next(t_next(t_root_0), true))) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.level < 3) {
			if (t_if_index_1 === 0) return;
			if (t_if_region_1.depth === -2) return;
			if (t_if_region_1.nextRegion !== null && t_if_region_1.nextRegion.depth > t_if_region_1.depth) {
				t_clear(t_if_region_1.nextRegion);
			}
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <!> `);
			const t_root_1 = t_root(t_fragment_1, true);
			let t_comp_anchor_1 = t_anchor(t_next(t_root_1)) as HTMLElement;

			/* @component */
			const t_props_1 = $watch({
				level: $props.level + 1,
			});
			$run(() => {
				t_props_1["level"] = $props.level + 1;
			});
			Self(t_fragment_1, t_comp_anchor_1, t_props_1, $context);

			const t_text_2 = t_next(t_comp_anchor_1, true);
			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_2);
			t_next(t_text_2);
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

	const t_text_3 = t_next(t_if_anchor_1, true);
	$run(() => {
		t_text_1.textContent = `Level ${t_fmt($props.level)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

	/**/ });
}
