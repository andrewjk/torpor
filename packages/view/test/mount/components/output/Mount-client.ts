import $mount from "../../../../src/render/$mount";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Mount(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props:  Record<PropertyKey, any> | undefined,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	let inputElement: HTMLInputElement;

	$mount(() => {
		inputElement.value = "hi";
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <input></input> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_input_1 = t_next(t_root_0) as HTMLInputElement;
	const t_text_1 = t_next(t_input_1, true);
	inputElement = t_input_1;
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
