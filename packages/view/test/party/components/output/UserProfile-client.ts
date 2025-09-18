import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
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
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>#</p> <p>#</p> <p>#</p> <p>#</p> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_text_2 = t_child(t_next(t_next(t_next(t_root_0), true)));
	const t_text_3 = t_child(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)));
	const t_text_4 = t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)), true)));
	// @ts-ignore
	const t_text_5 = t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_root_0), true)), true)), true)), true);
	$run(function setAttributes() {
		t_text_1.textContent = `My name is ${t_fmt($props.name)}!`;
		t_text_2.textContent = `My age is ${t_fmt($props.age)}!`;
		t_text_3.textContent = `My favourite colors are ${t_fmt($props.favouriteColors.join(", "))}!`;
		t_text_4.textContent = `I am ${t_fmt($props.isAvailable ? "available" : "not available")}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_5);
	t_next(t_text_5);

}
