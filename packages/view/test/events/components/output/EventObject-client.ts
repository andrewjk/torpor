import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function EventObject(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ type: "", target: "", currentTarget: "" });

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<button id="btn"> Click me </button> <p>#</p> <p>#</p> <p>#</p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_button_1 = t_root_0 as HTMLButtonElement;
	const t_text_1 = t_child(t_next(t_next(t_button_1, true)));
	const t_text_2 = t_child(t_next(t_next(t_next(t_next(t_button_1, true)), true)));
	const t_p_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_button_1, true)), true)), true)) as HTMLElement;
	const t_text_3 = t_child(t_p_1);
	t_event(t_button_1, "click", (e) => {
		$state.type = e.type;
		$state.target = (e.target as HTMLElement).tagName;
		$state.currentTarget = (e.currentTarget as HTMLElement).tagName;
	});
	$run(() => {
		t_text_1.textContent = `Type: ${t_fmt($state.type)}`;
		t_text_2.textContent = `Target: ${t_fmt($state.target)}`;
		t_text_3.textContent = `Current: ${t_fmt($state.currentTarget)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
