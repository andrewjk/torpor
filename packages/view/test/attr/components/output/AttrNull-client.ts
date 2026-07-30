import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function AttrNull(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { title: string | null; label: string | undefined; count: number | null },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div data-count=""> Content </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	$run(() => {
		t_attribute(t_div_1, "title", $props.title);
		t_attribute(t_div_1, "aria-label", $props.label);
		t_attribute(t_div_1, "data-count", $props.count);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_div_1);
	t_next(t_div_1);

}
