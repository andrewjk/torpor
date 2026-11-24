import t_add_element from "../../../../src/render/addElement";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function BubbleTargets(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { targets: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div id="outer"><button id="inner"> click </button></div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	const t_button_1 = t_child(t_div_1) as HTMLButtonElement;
	t_event(t_div_1, "click", (e) => $props.targets.push((e.currentTarget as HTMLElement).id));
	t_event(t_button_1, "click", (e) => $props.targets.push((e.currentTarget as HTMLElement).id));
	t_add_element(t_div_1, $parent, $anchor);

}
