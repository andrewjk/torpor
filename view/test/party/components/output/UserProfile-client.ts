import $run from "../../../../src/render/$run";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function UserProfile(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		name: string,
		age: number,
		favoriteColors: string[],
		isAvailable: boolean
	},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div> <p>#</p> <p>#</p> <p>#</p> <p>#</p> </div>`);
	// @ts-ignore
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_child(t_div_1)));
	const t_text_2 = t_child(t_next(t_next(t_next(t_child(t_div_1)))));
	const t_text_3 = t_child(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1)))))));
	const t_text_4 = t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1)))))))));
	$run(function setTextContent() {
		t_text_1.textContent = `My name is ${t_fmt($props.name)}!`;
	});
	$run(function setTextContent() {
		t_text_2.textContent = `My age is ${t_fmt($props.age)}!`;
	});
	$run(function setTextContent() {
		t_text_3.textContent = `My favourite colors are ${t_fmt($props.favouriteColors.join(", "))}!`;
	});
	$run(function setTextContent() {
		t_text_4.textContent = `I am ${t_fmt($props.isAvailable ? "available" : "not available")}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
	t_next(t_div_1);

}
