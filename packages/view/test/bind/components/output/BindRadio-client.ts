import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function BindRadio(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ color: "red" });

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<label><input type="radio" name="color" value="red"> Red </label> <label><input type="radio" name="color" value="green"> Green </label> <label><input type="radio" name="color" value="blue"> Blue </label> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_input_1 = t_child(t_root_0) as HTMLInputElement;
	const t_input_2 = t_child(t_next(t_next(t_root_0, true))) as HTMLInputElement;
	const t_input_3 = t_child(t_next(t_next(t_next(t_next(t_root_0, true)), true))) as HTMLInputElement;
	const t_p_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_root_0, true)), true)), true)) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(() => {
		t_input_1.checked = $state.color == "red";
	});
	t_event(t_input_1, "change", (e) => {
		if (e.target.checked) $state.color = "red";
	});
	$run(() => {
		t_input_2.checked = $state.color == "green";
	});
	t_event(t_input_2, "change", (e) => {
		if (e.target.checked) $state.color = "green";
	});
	$run(() => {
		t_input_3.checked = $state.color == "blue";
	});
	t_event(t_input_3, "change", (e) => {
		if (e.target.checked) $state.color = "blue";
	});
	$run(() => {
		t_text_1.textContent = `Selected: ${t_fmt($state.color)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
