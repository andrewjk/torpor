import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function UserProfileApp(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		name: "John" as const,
		age: 20,
		favoriteColors: ["green", "blue", "red"],
		isAvailable: true,
	});
	$run(() => {
		t_props_1["age"] = 20;
		t_props_1["favoriteColors"] = ["green", "blue", "red"];
	});
	UserProfile(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_comp_anchor_1, t_root_0);
	t_next(t_comp_anchor_1);

}

function UserProfile(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		name: string,
		age: number,
		favoriteColors: string[],
		isAvailable: boolean
	},
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
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
		t_text_1.textContent = `My name is ${t_fmt($props.name)}!`;
		t_text_2.textContent = `My age is ${t_fmt($props.age)}!`;
		t_text_3.textContent = `My favourite colors are ${t_fmt($props.favoriteColors.join(", "))}!`;
		t_text_4.textContent = `I am ${t_fmt($props.isAvailable ? "available" : "not available")}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
