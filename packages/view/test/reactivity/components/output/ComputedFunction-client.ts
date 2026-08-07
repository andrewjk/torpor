import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ComputedGetter(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { count: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p> <p>#</p> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_text_2 = t_child(t_next(t_next(t_root_0, true)));
	const t_p_1 = t_next(t_next(t_next(t_next(t_root_0, true)), true)) as HTMLElement;
	const t_text_3 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = `Count: ${t_fmt($props.count)}`;
		t_text_2.textContent = `Doubled: ${t_fmt($props.count * 2)}`;
		t_text_3.textContent = `Quadrupled: ${t_fmt($props.count * 4)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
