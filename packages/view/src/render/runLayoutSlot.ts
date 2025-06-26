import type { Component } from "../types/Component";
import type { Range } from "../types/Range";
import type { SlotRender } from "../types/SlotRender";
import newRange from "./newRange";
import popRange from "./popRange";
import pushRange from "./pushRange";

export default function runLayoutSlot(
	component: Component,
	slot: SlotRender,
	parent: ParentNode,
	anchor: Node | null,
	$props: Record<string, string>,
	$context?: Record<PropertyKey, any>,
): Range {
	const range = newRange();
	const oldRange = pushRange(range);

	component(parent, anchor, $props, $context, {
		_: slot,
	});

	popRange(oldRange);

	return range;
}
