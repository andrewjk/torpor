import t_add_element from "../../../../src/render/addElement";
import t_animate from "../../../../src/render/addAnimation";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function TransitionMount(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	function enter() {
		return {
			keyframes: [{ opacity: "0" }, { opacity: "1" }],
			options: { duration: 100 },
		};
	}

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div class="fade">Hello</div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	const t_trans_in_1 = (enter)(t_div_1);
	const t_trans_out_1 = t_trans_in_1;
	t_animate(t_div_1, t_trans_in_1, t_trans_out_1);
	t_add_element(t_div_1, $parent, $anchor);

}
