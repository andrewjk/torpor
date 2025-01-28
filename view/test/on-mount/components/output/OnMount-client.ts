import $mount from "../../../../src/render/$mount";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_flush from "../../../../src/render/flushMountEffects";
import t_fragment from "../../../../src/render/getFragment";
import t_root from "../../../../src/render/nodeRoot";

export default function OnMount(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument, t_fragments, 0, `<input></input>`);
	const t_input_1 = t_root(t_fragment_0) as HTMLInputElement;
	$mount(function elMount() {
		return ((node) => node.value = "hi")(t_input_1);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);

	t_flush();
}
