import $peek from "../../../../src/render/$peek";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function CssStyle(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props:  Record<PropertyKey, any> | undefined,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <h1 class="title torp-1ew8jkr">I am red</h1> <button style="font-size: 10rem;">I am a button</button> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_next(t_next(t_next(t_next(t_root_0), true)), true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

	/**/ });
}
