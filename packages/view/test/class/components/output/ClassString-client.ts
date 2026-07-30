import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_class from "../../../../src/render/buildClasses";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ClassString(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { size: string; color: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p> Concatenated </p> <p> Joined </p>`);
	const t_p_1 = t_root(t_fragment_0) as HTMLElement;
	const t_p_2 = t_next(t_next(t_p_1, true)) as HTMLElement;
	$run(() => {
		t_p_1.className = t_class("box " + $props.size + " " + $props.color);
		t_p_2.className = t_class(["tag", $props.size, $props.color].join(" "));
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_2);
	t_next(t_p_2);

}
