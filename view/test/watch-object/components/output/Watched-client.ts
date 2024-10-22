import { $run } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_root } from "@tera/view";

export default function Watched(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <p>#</p> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_text_1 = t_child(t_next(t_child(t_div_1)));
	$run(function setTextContent() {
		t_text_1.textContent = ` ${t_fmt($props.text)} ${t_fmt($props.child.childText)} ${t_fmt($props.child.grandChild.grandChildText)} `;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

