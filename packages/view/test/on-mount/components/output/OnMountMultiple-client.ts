import $mount from "../../../../src/watch/$mount";
import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function OnMountMultiple(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let inputEl: HTMLInputElement;
	let selectEl: HTMLSelectElement;

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<input> <select><option>A</option><option>B</option><option>C</option></select> <p>#</p> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_input_1 = t_root_0 as HTMLInputElement;
	inputEl = t_input_1;
	const t_select_1 = t_next(t_next(t_input_1, true)) as HTMLSelectElement;
	selectEl = t_select_1;
	const t_text_1 = t_child(t_next(t_next(t_select_1, true)));
	const t_p_1 = t_next(t_next(t_next(t_next(t_select_1, true)), true)) as HTMLElement;
	const t_text_2 = t_child(t_p_1);
	// @ts-ignore
	$mount(() => {
		return ((node) => node.value = "set by onmount")(t_input_1);
	});
	// @ts-ignore
	$mount(() => {
		return ((node) => node.selectedIndex = 2)(t_select_1);
	});
	$run(() => {
		t_text_1.textContent = `Input: ${t_fmt(inputEl?.value)}`;
		t_text_2.textContent = `Select: ${t_fmt(selectEl?.value)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
