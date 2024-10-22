import type { ServerSlotRender } from "@tera/view";

export default function ParentChild(
	$props: { name: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	/* @start */
	@render {
		<div>
		<Child name="Anna" />
		</div>
	}
}

function Child(
	$props: { name: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	/* @start */
	@render {
		<h2>Hello, {$props.name}</h2>
	}
}

