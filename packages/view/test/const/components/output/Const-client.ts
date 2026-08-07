import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Const(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<p>#</p>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_p_1 = t_root_0 as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	/* @const */
	const name = "Boris";
	$run(() => {
		t_text_1.textContent = ` Hello, ${t_fmt(name)}! `;
	});
	t_add_element(t_p_1, $parent, $anchor);
	t_next(t_p_1);

}
