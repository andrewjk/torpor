import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function MultipleProps(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		title: "My Card" as const,
		subtitle: "A subtitle" as const,
		count: 42,
		active: true,
	});
	$run(() => {
		t_props_1["count"] = 42;
		t_props_1["active"] = true;
	});
	Card(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	const t_text_1 = t_next(t_comp_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}

function Card(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> <h2>#</h2> <h3>#</h3> <p>#</p> <!> </div> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_child(t_next(t_root_0))));
	const t_text_2 = t_child(t_next(t_next(t_next(t_child(t_next(t_root_0))), true)));
	const t_text_3 = t_child(t_next(t_next(t_next(t_next(t_next(t_child(t_next(t_root_0))), true)), true)));
	const t_if_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_if_anchor_1 = t_anchor(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_if_parent_1)), true)), true)), true))) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.active) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <span>Active</span> `);
			const t_root_1 = t_root(t_fragment_1, true);
			const t_text_4 = t_next(t_next(t_root_1), true);
			t_add_fragment(t_fragment_1, t_if_parent_1, t_before, t_text_4);
			t_next(t_text_4);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <span>Inactive</span> `);
			const t_root_2 = t_root(t_fragment_2, true);
			const t_text_5 = t_next(t_next(t_root_2), true);
			t_add_fragment(t_fragment_2, t_if_parent_1, t_before, t_text_5);
			t_next(t_text_5);
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
	});

	const t_text_6 = t_next(t_if_parent_1, true);
	$run(() => {
		t_text_1.textContent = t_fmt($props.title);
		t_text_2.textContent = t_fmt($props.subtitle);
		t_text_3.textContent = `Count: ${t_fmt($props.count)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_6);
	t_next(t_text_6);

}
