import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function AnswerButton(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <button>YES</button> <button>NO</button> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_button_1 = t_next(t_child(t_div_1)) as HTMLElement;
	const t_button_2 = t_next(t_next(t_button_1)) as HTMLElement;
	t_event(t_button_1, "click", $props.onYes);
	t_event(t_button_2, "click", $props.onNo);
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
