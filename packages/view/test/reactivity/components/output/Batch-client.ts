import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function BatchTest(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: number; b: number; c: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p> <p>#</p> <p>#</p> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_text_2 = t_child(t_next(t_next(t_root_0, true)));
	const t_text_3 = t_child(t_next(t_next(t_next(t_next(t_root_0, true)), true)));
	const t_p_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_root_0, true)), true)), true)) as HTMLElement;
	const t_text_4 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = `A: ${t_fmt($props.a)}`;
		t_text_2.textContent = `B: ${t_fmt($props.b)}`;
		t_text_3.textContent = `C: ${t_fmt($props.c)}`;
		t_text_4.textContent = `Sum: ${t_fmt($props.a + $props.b + $props.c)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
