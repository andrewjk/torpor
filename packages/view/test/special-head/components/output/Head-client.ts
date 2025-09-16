import $run from "../../../../src/render/$run";
import { type SlotRender } from "../../../../src/types/SlotRender";

export default function Head(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
) {

	/* Head */
	$run(function runTitle() {
		const t_old_title = document.title;
		document.title = "Hello";
		return () => document.title = t_old_title;
	});

}
