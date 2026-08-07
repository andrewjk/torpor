import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function NestedReactive(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { user: { name: string; tags: string[] } },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p> <ul><!></ul> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_for_parent_1 = t_next(t_next(t_root_0, true)) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_next(t_next(t_root_0, true)))) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_for_parent_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let tag of $props.user.tags) {
				t_new_items_1.push({ data: { tag }, key:
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
				t_text_2.textContent = t_fmt(t_item_1.data.tag);
			});
			t_add_element(t_li_1, t_for_parent_1, t_before_1);
			t_next(t_li_1);
		},
		(t_old_item, t_new_item) => {
			let t_changed = false;
			if (t_old_item.data.tag !== t_new_item.data.tag) {
				t_old_item.data.tag = t_new_item.data.tag;
				t_changed = true;
			}
			if (t_changed) t_rerun_region_effects(t_old_item);
		},
		true
	);

	const t_p_1 = t_next(t_next(t_next(t_next(t_root_0, true)), true)) as HTMLElement;
	const t_text_3 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = `Name: ${t_fmt($props.user.name)}`;
		t_text_3.textContent = `Tag count: ${t_fmt($props.user.tags.length)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
