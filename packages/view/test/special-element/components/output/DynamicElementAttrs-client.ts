import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_class from "../../../../src/render/buildClasses";
import t_dynamic from "../../../../src/render/setDynamicElement";
import t_event from "../../../../src/render/addEvent";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function DynamicTagAttrs(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { tag: string; cls: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<el id="target"> Content </el>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_element_1 = t_root_0 as HTMLElement;
	$run(() => {
		t_element_1 = t_dynamic(t_element_1, $props.tag);
	});
	t_event(t_element_1, "click", (e) => e.currentTarget.setAttribute("data-clicked", "yes"));
	$run(() => {

		t_element_1.className = t_class($props.cls);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_element_1, t_root_0);
	t_next(t_element_1);

}
