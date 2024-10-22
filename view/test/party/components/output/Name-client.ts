import { $run } from "@tera/view";
import { $watch } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

export default function Name(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	let $state = $watch({
		name: "John"
	});

	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<h1>#</h1>`);
	const t_h1_1 = t_root(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_h1_1);
	$run(function setTextContent() {
		t_text_1.textContent = `Hello ${t_fmt($state.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

