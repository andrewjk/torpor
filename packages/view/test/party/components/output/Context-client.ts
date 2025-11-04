import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function UserProfileContextApp(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$context = Object.assign({}, $context);
	$peek(() => { /**/

	const $user = $watch({
		id: 1,
		username: "unicorn42",
		email: "unicorn42@example.com",
	});

	// TODO: I think we're supposed to unwrap this and pass in an update function?
	$context.user = $user;

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <h1>#</h1> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	let t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_root_0), true))) as HTMLElement;

	/* @component */
	UserProfileContext(t_fragment_0, t_comp_anchor_1, undefined, $context);

	const t_text_2 = t_next(t_comp_anchor_1, true);
	$run(() => {
		t_text_1.textContent = `Welcome back, ${t_fmt($user.username)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

	/**/ });
}

function UserProfileContext(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$context = Object.assign({}, $context);
	$peek(() => { /**/

	$context.user = $watch($context.user);

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <h2>My Profile</h2> <p>#</p> <p>#</p> <button> Update username to Jane </button> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_next(t_next(t_root_0), true)));
	const t_text_2 = t_child(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)));
	const t_button_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)), true)) as HTMLButtonElement;
	const t_text_3 = t_next(t_button_1, true);
	t_event(t_button_1, "click", () => ($context.user.username = "Jane"));
	$run(() => {
		t_text_1.textContent = `Username: ${t_fmt($context.user.username)}`;
		t_text_2.textContent = `Email: ${t_fmt($context.user.email)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

	/**/ });
}
