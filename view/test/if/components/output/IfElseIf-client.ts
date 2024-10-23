import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_range } from "@tera/view";
import { t_root } from "@tera/view";
import { t_run_branch } from "@tera/view";
import { t_run_control } from "@tera/view";

export default function IfElseIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_if_anchor_1 = t_anchor(t_next(t_child(t_div_1))) as HTMLElement;

	/* @if */
	const t_if_range_1 = t_range();
	t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
		if ($props.counter > 10) {
			t_run_branch(t_if_range_1, 0, () => {
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <p> It's over ten! </p> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_text_1 = t_next(t_next(t_root_1));
				t_add_fragment(t_fragment_1, t_div_1, t_before);
				t_next(t_text_1);
			});
		}
		else if ($props.counter > 5) {
			t_run_branch(t_if_range_1, 1, () => {
				const t_fragment_2 = t_fragment(t_fragments, 2, ` <p> It's over five! </p> `);
				const t_root_2 = t_root(t_fragment_2);
				const t_text_2 = t_next(t_next(t_root_2));
				t_add_fragment(t_fragment_2, t_div_1, t_before);
				t_next(t_text_2);
			});
		}
		else {
			t_run_branch(t_if_range_1, 2, () => {
				const t_fragment_3 = t_fragment(t_fragments, 3, ` <p> It's not there yet </p> `);
				const t_root_3 = t_root(t_fragment_3);
				const t_text_3 = t_next(t_next(t_root_3));
				t_add_fragment(t_fragment_3, t_div_1, t_before);
				t_next(t_text_3);
			});
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);

}
