import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_class from "../../../../src/render/buildClasses";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
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
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<p> Falsy values </p>`);
	const t_p_1 = t_root_el(t_fragment_0) as HTMLElement;
	$run(() => {
		t_p_1.className = t_class({ a: $props.a, b: $props.b, c: $props.c, d: $props.d, e: $props.e, f: $props.f });
	});
	t_add_element(t_p_1, $parent, $anchor);
	t_next(t_p_1);

}
