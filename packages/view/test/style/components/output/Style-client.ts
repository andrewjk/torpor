import $run from "../../../../src/watch/$run";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import t_style from "../../../../src/render/buildStyles";

export default function Style(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> Hello! </div> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_div_1 = t_next(t_root_0) as HTMLDivElement;
	const t_text_1 = t_next(t_div_1, true);
	$run(() => {
		t_attribute(t_div_1, "style", t_style({ color: $props.color }) || null);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
