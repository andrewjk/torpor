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

export default function Self(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { level: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div>#<!> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_div_1);
	const t_if_anchor_1 = t_anchor(t_next(t_text_1)) as HTMLElement;

	/* @if */
	const t_if_range_1 = t_range();
	t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
		if ($props.level < 3) {
			t_run_branch(t_if_range_1, 0, () => {
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <!> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_comp_anchor_1 = t_anchor(t_next(t_root_1)) as HTMLElement;

				/* @component */
				const t_props_1 = {};
				$run(function setProp() {
					t_props_1["level"] = $props.level + 1;
				});

				Self(t_fragment_1, t_comp_anchor_1, t_props_1, $context);
				const t_text_2 = t_next(t_comp_anchor_1);
				t_add_fragment(t_fragment_1, t_div_1, t_before);
				t_next(t_text_2);
			});
		}
		else {
			t_run_branch(t_if_range_1, 1, () => {
			});
		}
	});

	$run(function setTextContent() {
		t_text_1.textContent = ` Level ${t_fmt($props.level)} `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

