import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Parent(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {
	$context = Object.assign({}, $context);

	$context["ParentContext"] = "hi from the parent";

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @component */
	ChildA(t_fragment_0, t_comp_anchor_1, undefined, $context);

	let t_comp_anchor_2 = t_anchor(t_next(t_next(t_comp_anchor_1, true))) as HTMLElement;

	/* @component */
	ChildB(t_fragment_0, t_comp_anchor_2, undefined, $context);

	const t_text_1 = t_next(t_comp_anchor_2, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}

function ChildA(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {
	$context = Object.assign({}, $context);

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

}

function ChildB(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {
	$context = Object.assign({}, $context);

	$context["ChildBContext"] = "hi!";

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>Nothing to see here...</p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_next(t_next(t_root_0), true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

}
