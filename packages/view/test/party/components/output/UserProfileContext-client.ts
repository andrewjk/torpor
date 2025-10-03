import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
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
	_$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {
	$context = Object.assign({}, $context);

	$context.user = $watch($context.user);

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <h2>My Profile</h2> <p>#</p> <p>#</p> <button> Update username to Jane </button> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_next(t_next(t_root_0), true)));
	const t_text_2 = t_child(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)));
	const t_button_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)), true)) as HTMLElement;
	// @ts-ignore
	const t_text_3 = t_next(t_button_1, true);
	t_event(t_button_1, "click",
	() => ($context.user.username = "Jane")
);
$run(function setAttributes() {
	t_text_1.textContent = `Username: ${t_fmt($context.user.username)}`;
	t_text_2.textContent = `Email: ${t_fmt($context.user.email)}`;
});
t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
t_next(t_text_3);

}
