import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_class from "../../../../src/render/buildClasses";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Class(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div id="divid" class="torp-1ljxz83"> From id </div> <div class="divclass torp-1ljxz83"> From string </div> <a class="torp-1ljxz83"> From state </a> <div class="torp-1ljxz83"> From state with scope </div> <div class="torp-1ljxz83"> Class object </div> <div class="torp-1ljxz83"> Class array </div> <div class="torp-1ljxz83"> Class nested </div> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_a_1 = t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)) as HTMLAnchorElement;
	const t_div_1 = t_next(t_next(t_a_1, true)) as HTMLDivElement;
	const t_div_2 = t_next(t_next(t_div_1, true)) as HTMLDivElement;
	const t_div_3 = t_next(t_next(t_div_2, true)) as HTMLDivElement;
	const t_div_4 = t_next(t_next(t_div_3, true)) as HTMLDivElement;
	let t_comp_anchor_1 = t_anchor(t_next(t_next(t_div_4, true))) as HTMLElement;

	/* @component */
	const t_props_1 = $watch({
		class: t_class({ "child-class": true }, "torp-1ljxz83"),
	});
	$run(() => {
		t_props_1["class"] = t_class({ "child-class": true }, "torp-1ljxz83");
	});
	Child(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	const t_text_1 = t_next(t_comp_anchor_1, true);
	$run(() => {
		t_a_1.className = t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83");
		t_div_1.className = t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83");
		t_div_2.className = t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-1ljxz83");
		t_div_3.className = t_class([ "foo", false, true && "baz", undefined ], "torp-1ljxz83");
		t_div_4.className = t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-1ljxz83");
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> Child class </div> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_div_1 = t_next(t_root_0) as HTMLDivElement;
	const t_text_1 = t_next(t_div_1, true);
	$run(() => {
		t_div_1.className = t_class($props.class);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
