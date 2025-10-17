import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function ChildA(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$context = Object.assign({}, $context);
	$peek(() => { /**/

	$context["ChildAContext"] = "hi!";

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>#</p> <p>#</p> <p>#</p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_text_2 = t_child(t_next(t_next(t_next(t_root_0), true)));
	const t_text_3 = t_child(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)));
	const t_text_4 = t_next(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)), true);
	$run(() => {
		t_text_1.textContent = `Parent: ${t_fmt($context["ParentContext"])}`;
		t_text_2.textContent = `Child a: ${t_fmt($context["ChildAContext"])}`;
		t_text_3.textContent = `Child b: ${t_fmt($context["ChildBContext"] ?? "???")}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

	/**/ });
}
