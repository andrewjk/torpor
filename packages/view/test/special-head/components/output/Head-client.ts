import $peek from "../../../../src/render/$peek";
import $run from "../../../../src/render/$run";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Head(
	_$parent: ParentNode,
	_$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* Head */
	$run(() => {
		const t_old_title = document.title;
		document.title = "Hello";
		return () => document.title = t_old_title;
	});

	/**/ });
}
