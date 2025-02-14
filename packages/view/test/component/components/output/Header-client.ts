import $run from "../../../../src/render/$run";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function Header(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= {};

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<h2>#</h2>`);
	// @ts-ignore
	const t_h2_1 = t_root(t_fragment_0) as HTMLElement;
	const t_text_1 = t_child(t_h2_1);
	$run(function setTextContent() {
		t_text_1.textContent = `Hi, ${t_fmt($props.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_h2_1);

}
