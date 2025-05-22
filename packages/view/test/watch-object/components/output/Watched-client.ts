import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Watched(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div> <p>#</p> </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_child(t_div_1)));
	$run(function setTextContent() {
		t_text_1.textContent = ` ${t_fmt($props.text)} ${t_fmt($props.child.childText)} ${t_fmt($props.child.grandChild.grandChildText)} `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_div_1);

}
