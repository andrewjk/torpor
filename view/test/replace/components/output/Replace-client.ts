import { $run } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_range } from "@tera/view";
import { t_root } from "@tera/view";
import { t_run_branch } from "@tera/view";
import { t_run_control } from "@tera/view";

export default function Replace(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	$props ??= {};
	let counter = 0;

	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_replace_anchor_1 = t_anchor(t_next(t_child(t_div_1))) as HTMLElement;

	/* @replace */
	const t_replace_range_1 = t_range();
	t_run_control(t_replace_range_1, t_replace_anchor_1, (t_before) => {
		$props.name;
		t_run_branch(t_replace_range_1, -1, () => {
			const t_fragment_1 = t_fragment(t_fragments, 1, ` <p>#</p> `);
			const t_root_1 = t_root(t_fragment_1);
			const t_text_1 = t_child(t_next(t_root_1));
			const t_text_2 = t_next(t_next(t_root_1));
			$run(function setTextContent() {
				t_text_1.textContent = `The replace count is ${t_fmt(counter++)}.`;
			});
			t_add_fragment(t_fragment_1, t_div_1, t_before);
			t_next(t_text_2);
		});
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);
}

