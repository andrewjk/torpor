import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_attribute from "../../../../src/render/setAttribute";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function AttrBoolean(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { disabled: boolean; checked: boolean; readonly: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<button>Click</button> <input type="checkbox"> <input type="text">`);
	const t_root_0 = t_root(t_fragment_0);
	const t_button_1 = t_root_0 as HTMLButtonElement;
	const t_input_1 = t_next(t_next(t_button_1, true)) as HTMLInputElement;
	const t_input_2 = t_next(t_next(t_input_1, true)) as HTMLInputElement;
	$run(() => {
		t_attribute(t_button_1, "disabled", $props.disabled);
		t_attribute(t_input_1, "checked", $props.checked);
		t_attribute(t_input_2, "readonly", $props.readonly);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_input_2, t_root_0);
	t_next(t_input_2);

}
