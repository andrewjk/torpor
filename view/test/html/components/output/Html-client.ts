import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function Html(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p> <!> </p>`);
	// @ts-ignore
	const t_p_1 = t_root(t_fragment_0) as HTMLElement;
	const t_html_anchor_1 = t_anchor(t_next(t_child(t_p_1))) as HTMLElement;

	/* @html */
	const t_html_range_1 = t_range();
	t_run_control(t_html_range_1, t_html_anchor_1, (t_before) => {
		t_run_branch(t_html_range_1, -1, () => {
			const t_template_1 = document.createElement("template");
			t_template_1.innerHTML = $props.html;
			let t_fragment_1 = t_template_1.content.cloneNode(true) as DocumentFragment;
			t_add_fragment(t_fragment_1, t_p_1, t_before);
		});
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);

}
