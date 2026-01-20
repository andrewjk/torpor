import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_class from "../../../../src/render/buildClasses";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Class(
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

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div id="divid" class="torp-16s1yph"> From id </div> <div class="divclass torp-16s1yph"> From string </div> <a class="torp-16s1yph"> From state </a> <div class="torp-16s1yph"> From state with scope </div> <div class="torp-16s1yph"> Class object </div> <div class="torp-16s1yph"> Class array </div> <div class="torp-16s1yph"> Class nested </div> <!> <!> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_a_1 = t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)) as HTMLAnchorElement;
	const t_div_1 = t_next(t_next(t_a_1, true)) as HTMLDivElement;
	const t_div_2 = t_next(t_next(t_div_1, true)) as HTMLDivElement;
	const t_div_3 = t_next(t_next(t_div_2, true)) as HTMLDivElement;
	const t_div_4 = t_next(t_next(t_div_3, true)) as HTMLDivElement;
	let t_comp_anchor_1 = t_anchor(t_next(t_next(t_div_4, true))) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		class: "hey torp-16s1yph" as const,
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
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` Class filtered `);
		const t_text_1 = t_root(t_fragment_2);
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_text_1);
		t_next(t_text_1);
	}
	Child(t_fragment_0, t_comp_anchor_1, t_props_1, $context, t_slots_1);

	let t_comp_anchor_2 = t_anchor(t_next(t_next(t_comp_anchor_1, true))) as HTMLElement;

	/* @component */
	let t_props_2 = $watch({
		class: [{ "child-class": true }, "torp-16s1yph"],
	});
	$run(() => {
		t_props_2["class"] = [{ "child-class": true }, "torp-16s1yph"];
	});
	const t_slots_2: Record<string, SlotRender> = {};
	t_slots_2["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_4 = t_fragment($parent.ownerDocument!, t_fragments, 4, ` Child class 1 `);
		const t_text_2 = t_root(t_fragment_4);
		t_add_fragment(t_fragment_4, $sparent, $sanchor, t_text_2);
		t_next(t_text_2);
	}
	Child(t_fragment_0, t_comp_anchor_2, t_props_2, $context, t_slots_2);

	let t_comp_anchor_3 = t_anchor(t_next(t_next(t_comp_anchor_2, true))) as HTMLElement;

	/* @component */
	let t_props_3 = $watch({
		class: "pink torp-16s1yph" as const,
	});
	const t_slots_3: Record<string, SlotRender> = {};
	t_slots_3["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_6 = t_fragment($parent.ownerDocument!, t_fragments, 6, ` Child class 2 `);
		const t_text_3 = t_root(t_fragment_6);
		t_add_fragment(t_fragment_6, $sparent, $sanchor, t_text_3);
		t_next(t_text_3);
	}
	Child(t_fragment_0, t_comp_anchor_3, t_props_3, $context, t_slots_3);

	const t_text_4 = t_next(t_comp_anchor_3, true);
	$run(() => {
		t_a_1.className = t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-16s1yph");
		t_div_1.className = t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-16s1yph");
		t_div_2.className = t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-16s1yph");
		t_div_3.className = t_class([ "foo", false, true && "baz", undefined ], "torp-16s1yph");
		t_div_4.className = t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-16s1yph");
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div data-state="active"> <!> </div> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_div_1 = t_next(t_root_0) as HTMLDivElement;
	let t_slot_anchor_1 = t_anchor(t_next(t_child(t_div_1))) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_div_1, t_slot_anchor_1, undefined, $context)
	} else {
		const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` Child class `);
		const t_text_1 = t_root(t_fragment_1);
		t_add_fragment(t_fragment_1, t_div_1, t_slot_anchor_1, t_text_1);
		t_next(t_text_1);
	}
	const t_text_2 = t_next(t_div_1, true);
	$run(() => {
		t_div_1.className = t_class($props.class);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
