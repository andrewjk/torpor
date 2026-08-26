import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function NumberInput(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { value: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<input type="number"> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_input_1 = t_root_0 as HTMLInputElement;
	const t_p_1 = t_next(t_next(t_input_1, true)) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(() => {
		t_input_1.value = String($props.value || 0);
	});
	t_event(t_input_1, "input", (e) => $props.value = Number(e.target.value));
	$run(() => {
		t_text_1.textContent = `Value: ${t_fmt($props.value)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
