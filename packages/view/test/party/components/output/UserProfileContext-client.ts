import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function UserProfileContext(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$context = Object.assign({}, $context);

	$context.user = $watch($context.user);

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div> <h2>My Profile</h2> <p>#</p> <p>#</p> <button> Update username to Jane </button> </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_child(t_div_1), 3));
	const t_text_2 = t_child(t_next(t_child(t_div_1), 5));
	const t_button_1 = t_next(t_child(t_div_1), 7) as HTMLElement;
	$run(function setTextContent() {
		t_text_1.textContent = `Username: ${t_fmt($context.user.username)}`;
	});
	$run(function setTextContent() {
		t_text_2.textContent = `Email: ${t_fmt($context.user.email)}`;
	});
	t_event(t_button_1, "click", () => ($context.user.username = "Jane"));
	t_add_fragment(t_fragment_0, $parent, $anchor, t_div_1);
	t_next(t_div_1);

}
