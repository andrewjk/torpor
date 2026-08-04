import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root_el from "../../../../src/render/nodeRootElement";
import type SlotRender from "../../../../src/types/SlotRender";

export default function PageTitle(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		pageTitle: ""
	});

	$run(() => {
		$state.pageTitle = document.title;
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<p>#</p>`);
	const t_p_1 = t_root_el(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = `Page title: ${t_fmt($state.pageTitle)}`;
	});
	t_add_element(t_p_1, $parent, $anchor);
	t_next(t_p_1);

}
