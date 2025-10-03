import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_event from "../../../../src/render/addEvent";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function AnswerButton(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <button>YES</button> <button>NO</button> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_button_1 = t_next(t_root_0) as HTMLElement;
	const t_button_2 = t_next(t_next(t_button_1, true)) as HTMLElement;
	const t_text_1 = t_next(t_button_2, true);
	t_event(t_button_1, "click",
	$props.onYes
);
t_event(t_button_2, "click",
$props.onNo
);
t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
t_next(t_text_1);

}
