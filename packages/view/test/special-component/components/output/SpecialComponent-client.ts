import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Component(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let components: Record<PropertyKey, any> = {
		BigTitle,
		SmallTitle
	};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_replace_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @replace */
	const t_replace_region_1 = t_region();
	t_run_control(t_replace_region_1, t_replace_anchor_1, (t_before) => {
		components[$props.self];
		if (!t_run_branch(t_replace_region_1, 0, -1)) return;
		const t_new_region = t_region();
		const t_old_region = t_push_region(t_new_region, true);
		const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
		const t_root_1 = t_root(t_fragment_1);
		let t_comp_anchor_1 = t_anchor(t_root_1) as HTMLElement;

		/* @component */
		let t_props_1 = $watch({
		});
		const t_slots_1: Record<string, SlotRender> = {};
		t_slots_1["_"] = (
			$sparent: ParentNode,
			$sanchor: Node | null,
			// @ts-ignore
			$slot?: Record<PropertyKey, any>,
			// @ts-ignore
			$context?: Record<PropertyKey, any>
		) => {
			const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` Hello! `);
			const t_root_3 = t_root(t_fragment_3, true);
			const t_text_1 = t_root_3;
			t_add_fragment(t_fragment_3, $sparent, $sanchor, t_text_1, t_root_3);
			t_next(t_text_1);
		}
		components[$props.self](t_fragment_1, t_comp_anchor_1, t_props_1, $context, t_slots_1);

		t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_comp_anchor_1, t_root_1);
		t_next(t_comp_anchor_1);
		t_pop_region(t_old_region);
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_replace_anchor_1, t_root_0);
	t_next(t_replace_anchor_1);

}

function BigTitle(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<h2><!></h2>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_h2_1 = t_root_0 as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_child(t_h2_1)) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_h2_1, t_slot_anchor_1, undefined, $context)
	}
	t_add_element(t_h2_1, $parent, $anchor);
	t_next(t_h2_1);

}

function SmallTitle(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<h6><!></h6>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_h6_1 = t_root_0 as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_child(t_h6_1)) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_h6_1, t_slot_anchor_1, undefined, $context)
	}
	t_add_element(t_h6_1, $parent, $anchor);
	t_next(t_h6_1);

}
