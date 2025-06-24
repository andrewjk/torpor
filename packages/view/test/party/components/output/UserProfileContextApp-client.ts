import $run from "../../../../src/render/$run";
import $unwrap from "../../../../src/render/$unwrap";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

import UserProfileContext from "../output/./UserProfileContext-client";

export default function UserProfileContextApp(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$context = Object.assign({}, $context);

	const $user = $watch({
		id: 1,
		username: "unicorn42",
		email: "unicorn42@example.com",
	});

	// TODO: I think we're supposed to $unwrap this and pass in an update function?
	$context.user = $user;

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> <h1>#</h1> <!> </div> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_child(t_next(t_root_0))));
	const t_comp_parent_1 = t_next(t_root_0) as HTMLElement;
	const t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_comp_parent_1)), true))) as HTMLElement;

	/* @component */
	UserProfileContext(t_comp_parent_1, t_comp_anchor_1, undefined, $context);

	// @ts-ignore
	const t_text_2 = t_next(t_comp_parent_1, true);
	$run(function setTextContent() {
		t_text_1.textContent = `Welcome back, ${t_fmt($user.username)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
