import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Replace(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let counter = 0;

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_replace_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @replace */
	const t_replace_region_1 = t_region();
	t_run_control(t_replace_region_1, t_replace_anchor_1, (t_before) => {
		$props.name;
		if (!t_run_branch(t_replace_region_1, 0, -1)) return;
		const t_new_region = t_region();
		const t_old_region = t_push_region(t_new_region, true);
		const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>#</p> `);
		const t_root_1 = t_root(t_fragment_1, true);
		const t_text_1 = t_child(t_next(t_root_1));
		const t_text_2 = t_next(t_next(t_root_1), true);
		$run(() => {
			t_text_1.textContent = `The replace count is ${t_fmt(counter++)}.`;
		});
		t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_2);
		t_next(t_text_2);
		t_pop_region(t_old_region);
	});

	const t_text_3 = t_next(t_replace_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}
