import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_class from "../../../../src/render/getClasses";
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
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div class="torp-1ljxz83"> <div id="divid" class="torp-1ljxz83"> From id </div> <div class="divclass torp-1ljxz83"> From string </div> <a class="torp-1ljxz83"> From state </a> <div class="torp-1ljxz83"> From state with scope </div> <div class="torp-1ljxz83"> Class object </div> <div class="torp-1ljxz83"> Class array </div> <div class="torp-1ljxz83"> Class nested </div> <!> </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_a_1 = t_next(t_child(t_div_1), 5) as HTMLElement;
	const t_div_2 = t_next(t_a_1, 2) as HTMLDivElement;
	const t_div_3 = t_next(t_div_2, 2) as HTMLDivElement;
	const t_div_4 = t_next(t_div_3, 2) as HTMLDivElement;
	const t_div_5 = t_next(t_div_4, 2) as HTMLDivElement;
	const t_comp_anchor_1 = t_anchor(t_next(t_div_5, 2)) as HTMLElement;

	/* @component */
	const t_props_1: any = $watch({});
	$run(function setClasses() {
		t_props_1["class"] = t_class({ "child-class": true });
	});
	Child(t_div_1, t_comp_anchor_1, t_props_1, $context);
	$run(function setClasses() {
		t_a_1.className = t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83");
	});
	$run(function setClasses() {
		t_div_2.className = t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83");
	});
	$run(function setClasses() {
		t_div_3.className = t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-1ljxz83");
	});
	$run(function setClasses() {
		t_div_4.className = t_class([ "foo", false, true && "baz", undefined ], "torp-1ljxz83");
	});
	$run(function setClasses() {
		t_div_5.className = t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-1ljxz83");
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_div_1);

}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div> Child class </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	$run(function setClassName() {
		t_div_1.className = $props.class;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_div_1);

}
