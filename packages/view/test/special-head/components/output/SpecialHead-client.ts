import $run from "../../../../src/watch/$run";
import t_attribute from "../../../../src/render/setAttribute";
import t_head_element from "../../../../src/render/headElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Head(
	_$parent: ParentNode,
	_$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* Head */
	$run(() => {
		const t_old_title = document.title;
		document.title = "Hello";
		return () => document.title = t_old_title;
	});
	$run(() => {
		const t_head_el = t_head_element("meta", "meta[name=\"description\"]");
		t_attribute(t_head_el, "name", "description");
		t_attribute(t_head_el, "content", "A test");
	});

}
