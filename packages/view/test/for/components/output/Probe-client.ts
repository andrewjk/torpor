import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Probe(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { name: string }[] },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_for_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_fragment_0,
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
			const item = t_item_1.data;
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			const t_root_1 = t_root(t_fragment_1);
			let t_comp_anchor_1 = t_anchor(t_root_1) as HTMLElement;

			/* @component */
			let t_props_1 = $watch({
				label: item.name,
				value: item.name,
			});
			$run(() => {
				const item = t_item_1.data;
				t_props_1["label"] = item.name;
				t_props_1["value"] = item.name;
			}, undefined, { forVarMask: 1 });
			Child(t_fragment_1, t_comp_anchor_1, t_props_1, $context);

			/* @const */
			const x = item.name;
			t_add_fragment(t_fragment_1, t_fragment_0, t_before_1, t_comp_anchor_1, t_root_1);
			t_next(t_comp_anchor_1);
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

	t_add_fragment(t_fragment_0, $parent, $anchor, t_for_anchor_1, t_root_0);
	t_next(t_for_anchor_1);

}
