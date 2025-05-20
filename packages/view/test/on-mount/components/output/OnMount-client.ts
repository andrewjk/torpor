import $mount from "../../../../src/render/$mount";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function OnMount(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<input></input>`);
	// @ts-ignore
	const t_input_1 = t_root(t_fragment_0) as HTMLInputElement;
	$mount(function elMount() {
		return ((node) => node.value = "hi")(t_input_1);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_input_1);

}
