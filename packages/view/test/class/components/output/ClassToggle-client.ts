import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_class from "../../../../src/render/buildClasses";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ClassToggle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { active: boolean; emphasis: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p> Toggle class </p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_p_1 = t_next(t_root_0) as HTMLElement;
	const t_text_1 = t_next(t_p_1, true);
	$run(() => {
		t_p_1.className = t_class({ active: $props.active, emphasis: $props.emphasis, base: true });
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
