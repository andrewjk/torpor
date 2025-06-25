import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function BindComponent(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	let $state = $watch({ name: "Alice", selected: 1 });

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> <!> <p>#</p> </div> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_comp_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_comp_anchor_1 = t_anchor(t_next(t_child(t_comp_parent_1))) as HTMLElement;

	/* @component */
	const t_props_1: any = $watch({});
	$run(function setProp() {
		t_props_1["name"] = $state.name;
	});
	$run(function setBinding() {
		$state.name = t_props_1["name"];
	});
	BindText(t_comp_parent_1, t_comp_anchor_1, t_props_1, $context);

	const t_text_1 = t_child(t_next(t_next(t_comp_anchor_1, true)));
	// @ts-ignore
	const t_text_2 = t_next(t_comp_parent_1, true);
	$run(function setTextContent() {
		t_text_1.textContent = `Hello, ${t_fmt($state.name)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}

function BindText(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	//let $state = $watch({
		//	text: $props.name
		//})

		// $run(() => t_name_changed($props.name))

		//$run(() => {
			//	$props.name = $state.text
			//});

			/* User interface */
			const t_fragments: DocumentFragment[] = [];

			const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div> <input></input> </div> `);
			// @ts-ignore
			const t_root_0 = t_root(t_fragment_0, true);
			const t_input_1 = t_next(t_child(t_next(t_root_0))) as HTMLInputElement;
			// @ts-ignore
			const t_text_1 = t_next(t_next(t_root_0), true);
			$run(function setBinding() {
				t_input_1.value = $props.name || "";
			});
			t_event(t_input_1, "input", (e) => $props.name = e.target.value);
			t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
			t_next(t_text_1);

		}
