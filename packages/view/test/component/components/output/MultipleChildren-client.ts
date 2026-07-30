import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function MultipleChildren(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { text: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	const t_slots_1: Record<string, SlotRender> = {};
	t_slots_1["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `<h1>Title</h1> <p>Body text</p> <footer>Footer</footer>`);
		const t_root_2 = t_root(t_fragment_2);
		const t_footer_1 = t_next(t_next(t_next(t_next(t_root_2, true)), true)) as HTMLElement;
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_footer_1);
		t_next(t_footer_1);
	}
	Card(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);

	const t_p_1 = t_next(t_next(t_comp_anchor_1, true)) as HTMLElement;
	const t_text_1 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = t_fmt($props.text);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1);
	t_next(t_p_1);

}

function Card(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div class="card"><!></div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	let t_slot_anchor_1 = t_anchor(t_child(t_div_1)) as HTMLElement;
	if ($slots && $slots["_"]) {
		$slots["_"](t_div_1, t_slot_anchor_1, undefined, $context)
	}
	t_add_fragment(t_fragment_0, $parent, $anchor, t_div_1);
	t_next(t_div_1);

}
