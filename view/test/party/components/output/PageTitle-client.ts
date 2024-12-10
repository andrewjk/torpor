import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_root from "../../../../src/render/nodeRoot";

export default function PageTitle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {

	let $state = $watch({
		pageTitle: ""
	});

	$run(() => {
		$state.pageTitle = document.title;
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument, t_fragments, 0, `<p>#</p>`);
	const t_p_1 = t_root(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(function setTextContent() {
		t_text_1.textContent = `Page title: ${t_fmt($state.pageTitle)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);

}
