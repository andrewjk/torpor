import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function Self(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { level: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div>#<!> </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_div_1);
	const t_if_anchor_1 = t_anchor(t_next(t_text_1)) as HTMLElement;

	/* @if */
	const t_if_range_1 = t_range();
	t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
		if ($props.level < 3) {
			t_run_branch(t_if_range_1, 0, () => {
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <!> `);
				// @ts-ignore
				const t_root_1 = t_root(t_fragment_1);
				const t_comp_anchor_1 = t_anchor(t_next(t_root_1)) as HTMLElement;

				/* @component */
				const t_props_1: any = $watch({});
				$run(function setProp() {
					t_props_1["level"] = $props.level + 1;
				});
				Self(t_fragment_1, t_comp_anchor_1, t_props_1, $context);
				// @ts-ignore
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
	t_next(t_div_1);

}
