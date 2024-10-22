import { $run } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

import UserProfile from "./UserProfile.tera";

export default function UserProfileApp(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	const t_props_1 = {};
	t_props_1["name"] = "John";
	$run(function setProp() {
		t_props_1["age"] = 20;
	});
	$run(function setProp() {
		t_props_1["favouriteColors"] = ["green", "blue", "red"];
	});
	t_props_1["isAvailable"] = true;

	UserProfile(t_fragment_0, t_comp_anchor_1, t_props_1, $context);
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

