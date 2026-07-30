import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_class from "../../../../src/render/buildClasses";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ClassFalsy(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean; c: number; d: number; e: string; f: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p> Falsy values </p>`);
	const t_p_1 = t_root(t_fragment_0) as HTMLElement;
	$run(() => {
		t_p_1.className = t_class({ a: $props.a, b: $props.b, c: $props.c, d: $props.d, e: $props.e, f: $props.f });
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1);
	t_next(t_p_1);

}
