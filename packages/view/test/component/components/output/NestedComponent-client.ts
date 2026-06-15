import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function NestedComponent(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { parentName: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <h1>#</h1> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	let t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_root_0), true))) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		name: $props.parentName,
	});
	$run(() => {
		t_props_1["name"] = $props.parentName;
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
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <!> `);
		const t_root_2 = t_root(t_fragment_2, true);
		let t_comp_anchor_2 = t_anchor(t_next(t_root_2)) as HTMLElement;

		/* @component */
		let t_props_2 = $watch({
			name: $props.parentName,
		});
		$run(() => {
			t_props_2["name"] = $props.parentName;
		});
		Child(t_fragment_2, t_comp_anchor_2, t_props_2, $context);

		const t_text_2 = t_next(t_comp_anchor_2, true);
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_text_2);
		t_next(t_text_2);
	}
	Parent(t_fragment_0, t_comp_anchor_1, t_props_1, $context, t_slots_1);

	const t_text_3 = t_next(t_comp_anchor_1, true);
	$run(() => {
		t_text_1.textContent = t_fmt($props.parentName);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}

function Parent(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> <p>#</p> <!> </div> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_child(t_next(t_root_0))));
	const t_slot_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_slot_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_slot_parent_1)), true))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_slot_parent_1, t_slot_anchor_1, undefined, $context)
	}
	const t_text_2 = t_next(t_slot_parent_1, true);
	$run(() => {
		t_text_1.textContent = `Parent: ${t_fmt($props.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}

function Child(
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

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>#</p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_text_2 = t_next(t_next(t_root_0), true);
	$run(() => {
		t_text_1.textContent = `Child: ${t_fmt($props.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
