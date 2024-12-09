import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_fragment from "../../../../src/render/getFragment";
import t_root from "../../../../src/render/nodeRoot";

export default function CssStyle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <h1 class="title tera-1ew8jkr">I am red</h1> <button style="font-size: 10rem;">I am a button</button> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
