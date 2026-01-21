import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Ref(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let button: HTMLButtonElement;

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <button> hi </button> <p>#</p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_button_1 = t_next(t_root_0) as HTMLButtonElement;
	button = t_button_1;
	const t_text_1 = t_child(t_next(t_next(t_button_1, true)));
	const t_text_2 = t_next(t_next(t_next(t_button_1, true)), true);
	$run(() => {
		t_text_1.textContent = ` the button's text is '${t_fmt(button?.textContent)}' `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
