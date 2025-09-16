import $run from "../../../../src/render/$run";
import { type SlotRender } from "../../../../src/types/SlotRender";

export default function Head(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

	/* Head */
	$run(function runTitle() {
		const t_old_title = document.title;
		document.title = "Hello";
		return () => document.title = t_old_title;
	});

}
