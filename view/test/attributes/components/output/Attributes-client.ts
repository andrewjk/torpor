import $run from "../../../../src/render/$run";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment from "../../../../src/render/getFragment";
import t_root from "../../../../src/render/nodeRoot";

export default function Attributes(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div data-thing=""> Hello! </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	$run(function setAttribute() {
		t_attribute(t_div_1, "thing", $props.thing);
	});
	$run(function setDataAttribute() {
		t_attribute(t_div_1, "data-thing", $props.dataThing);
	});
	$run(function setAttribute() {
		t_attribute(t_div_1, "caption", `this attribute is for ${$props.description}`);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
