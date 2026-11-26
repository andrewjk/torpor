import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import t_skip from "../../../../src/render/nodeSkip";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Links(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { href: string; items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<a id="static" href="/static">Static</a> <a id="dynamic">Dynamic</a> <a id="external" href="https://example.com/x">External</a> <a id="hash" href="#top">Hash</a> <img src="/logo.png"> <form action="/save"></form> <ul><!></ul>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_a_1 = t_skip(t_root_0, 2, 1) as HTMLAnchorElement;
	const t_ul_1 = t_skip(t_a_1, 10, 341) as HTMLElement;
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
				t_new_items_1.push({ data: item });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<li><a class="item">#</a></li>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_li_1 = t_root_1 as HTMLElement;
			const t_a_2 = t_child(t_li_1) as HTMLAnchorElement;
			const t_text_1 = t_child(t_a_2);
			$run(() => {
				const item = t_item_1.data;
				t_attribute(t_a_2, "href", "/items/" + item);
				t_text_1.textContent = t_fmt(item);
			}, undefined, { forVarMask: 1 });
			t_add_element(t_li_1, t_ul_1, t_before_1);
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

	$run(() => {
		t_attribute(t_a_1, "href", $props.href);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_ul_1, t_root_0);

}
