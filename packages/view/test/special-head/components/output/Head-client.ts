import $run from "../../../../src/render/$run";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_fragment from "../../../../src/render/getFragment";
import t_root from "../../../../src/render/nodeRoot";

export default function Head(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);

	/* @head */
	$run(function runTitle() {
		const t_old_title = document.title;
		document.title = "Hello";
		return () => document.title = t_old_title;
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);

}
