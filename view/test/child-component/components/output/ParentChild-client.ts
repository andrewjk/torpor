import type { SlotRender } from "@tera/view";

export default function ParentChild(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	/* @start */
	@render {
		<div>
		<Child name="Anna" />
		</div>
	}
}

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	/* @start */
	@render {
		<h2>Hello, {$props.name}</h2>
	}
}

