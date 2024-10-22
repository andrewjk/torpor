import { $run } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

export default function For(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div class="hello"> Hello! </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	$run(function setClassList() {
		t_div_1.classList.toggle("red", $props.red);
	});
	$run(function setClassList() {
		t_div_1.classList.toggle("green", $props.green);
	});
	$run(function setClassList() {
		t_div_1.classList.toggle("blue", $props.blue);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

