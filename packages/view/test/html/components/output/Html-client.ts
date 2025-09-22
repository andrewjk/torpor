import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
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
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p> <!> </p> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_html_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_html_anchor_1 = t_anchor(t_next(t_child(t_html_parent_1))) as HTMLElement;

	/* @html */
	const t_html_range_1 = t_range();
	t_run_control(t_html_range_1, t_html_anchor_1, (t_before) => {
		$props.html;
		t_run_branch(t_html_range_1, () => {
			const t_template_1 = document.createElement("template");
			t_template_1.innerHTML = $props.html;
			let t_fragment_1 = t_template_1.content.cloneNode(true) as DocumentFragment;
			t_add_fragment(t_fragment_1, t_html_parent_1, t_before);
		});
	});

	// @ts-ignore
	const t_text_1 = t_next(t_html_parent_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
