import { $await } from "@torpor/view";
import { $pending } from "@torpor/view";
import { $refresh } from "@torpor/view";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_fragment from "../../../../src/render/addFragment";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import type SlotRender from "../../../../src/types/SlotRender";

export default function SelfDisablingRefresh(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let fetchCount = 0;
	let $state = $watch({
		get users() {
			return $await(() => {
				const count = ++fetchCount;
				return new Promise((resolve) => {
					setTimeout(() => resolve("users #" + count), 10);
				});
			});
		},
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p> <button> refresh </button>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_button_1 = t_next(t_next(t_root_0, true)) as HTMLButtonElement;
	t_event(t_button_1, "click", () => $refresh(() => $state.users));
	$run(() => {
		t_text_1.textContent = `Users: ${t_fmt($state.users)}`;
		t_attribute(t_button_1, "disabled", $pending(() => $state.users));
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_button_1, t_root_0);
	t_next(t_button_1);

}
