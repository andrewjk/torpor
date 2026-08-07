import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function TextValues(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { str: string; num: number; bool: boolean; nullVal: null; undefVal: undefined; zero: number; negNum: number; nan: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p id="str">#</p> <p id="num">#</p> <p id="bool">#</p> <p id="null">#</p> <p id="undef">#</p> <p id="zero">#</p> <p id="neg">#</p> <p id="nan">#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_text_2 = t_child(t_next(t_next(t_root_0, true)));
	const t_text_3 = t_child(t_next(t_next(t_next(t_next(t_root_0, true)), true)));
	const t_text_4 = t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0, true)), true)), true)));
	const t_text_5 = t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0, true)), true)), true)), true)));
	const t_text_6 = t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0, true)), true)), true)), true)), true)));
	const t_text_7 = t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0, true)), true)), true)), true)), true)), true)));
	const t_p_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0, true)), true)), true)), true)), true)), true)), true)) as HTMLElement;
	const t_text_8 = t_child(t_p_1);
	$run(() => {
		t_text_1.textContent = t_fmt($props.str);
		t_text_2.textContent = t_fmt($props.num);
		t_text_3.textContent = t_fmt($props.bool);
		t_text_4.textContent = t_fmt($props.nullVal);
		t_text_5.textContent = t_fmt($props.undefVal);
		t_text_6.textContent = t_fmt($props.zero);
		t_text_7.textContent = t_fmt($props.negNum);
		t_text_8.textContent = t_fmt($props.nan);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
