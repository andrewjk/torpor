import $run from "../../../../src/render/$run";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_class from "../../../../src/render/getClasses";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Class(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument, t_fragments, 0, `<div> <div> Hello! </div> <div> Class object </div> <div> Class array </div> <div> Class nested </div> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_div_2 = t_next(t_child(t_div_1)) as HTMLDivElement;
	const t_div_3 = t_next(t_next(t_div_2)) as HTMLDivElement;
	const t_div_4 = t_next(t_next(t_div_3)) as HTMLDivElement;
	const t_div_5 = t_next(t_next(t_div_4)) as HTMLDivElement;
	$run(function setClasses() {
		t_div_2.className = t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue });
	});
	$run(function setClasses() {
		t_div_3.className = t_class({ foo: true, bar: false, baz: 5, qux: null });
	});
	$run(function setClasses() {
		t_div_4.className = t_class([ "foo", false, true && "baz", undefined ]);
	});
	$run(function setClasses() {
		t_div_5.className = t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ]);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
