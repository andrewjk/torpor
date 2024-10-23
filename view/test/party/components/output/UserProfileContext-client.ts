import { $run } from "@tera/view";
import { $watch } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_child } from "@tera/view";
import { t_event } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_root } from "@tera/view";

export default function UserProfileContext(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	$context = Object.assign({}, $context);

	$context.user = $watch($context.user);

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <h2>My Profile</h2> <p>#</p> <p>#</p> <button> Update username to Jane </button> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_next(t_next(t_child(t_div_1)))));
	const t_text_2 = t_child(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1)))))));
	const t_button_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1)))))))) as HTMLElement;
	$run(function setTextContent() {
		t_text_1.textContent = `Username: ${t_fmt($context.user.username)}`;
	});
	$run(function setTextContent() {
		t_text_2.textContent = `Email: ${t_fmt($context.user.email)}`;
	});
	t_event(t_button_1, "click", () => ($context.user.username = "Jane"));
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
