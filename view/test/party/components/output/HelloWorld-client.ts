import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

export default function HelloWorld(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<h1>Hello world</h1>`);
	const t_h1_1 = t_root(t_fragment_0) as HTMLElement;
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

