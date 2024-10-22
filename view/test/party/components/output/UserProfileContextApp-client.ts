import { $run } from "@tera/view";
import { $unwrap } from "@tera/view";
import { $watch } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_root } from "@tera/view";

import UserProfileContext from "./UserProfileContext.tera";

export default function UserProfileContextApp(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	const $user = $watch({
		id: 1,
		username: "unicorn42",
		email: "unicorn42@example.com",
	});

	// TODO: I think we're supposed to $unwrap this and pass in an update function?
	$context.user = $user;

	
	$context = Object.assign({}, $context);
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <h1>#</h1> <!> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_child(t_div_1)));
	const t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_div_1))))) as HTMLElement;

	/* @component */

	UserProfileContext(t_div_1, t_comp_anchor_1, undefined, $context);
	$run(function setTextContent() {
		t_text_1.textContent = `Welcome back, ${t_fmt($user.username)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

