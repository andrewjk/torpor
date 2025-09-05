import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Attributes(
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

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div data-thing=""> Hello! </div> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_div_1 = t_next(t_root_0) as HTMLDivElement;
	// @ts-ignore
	const t_text_1 = t_next(t_div_1, true);
	$run(function setAttribute() {
		t_attribute(t_div_1, "thing", $props.thing);
	});
	$run(function setDataAttribute() {
		t_attribute(t_div_1, "data-thing", $props.dataThing);
	});
	$run(function setAttribute() {
		t_attribute(t_div_1, "caption", `this attribute is for ${$props.description}`);
	});
	$run(function setAttribute() {
		t_attribute(t_div_1, "attr", $props.attr);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
