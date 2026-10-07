import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";
import t_style from "../../../../src/render/buildStyles";
import type SlotRender from "../../../../src/types/SlotRender";

export default function StyleClear(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { hidden: boolean; color: string | undefined },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div class="object">Object</div> <div class="string">String</div>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	const t_div_2 = t_next(t_next(t_div_1, true)) as HTMLDivElement;
	$run(() => {
		t_div_1.style.cssText = t_style({ display: $props.hidden ? "none" : undefined });
		t_div_2.style.cssText = t_style(`color: ${$props.color}`);
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_div_2, t_root_0);
	t_next(t_div_2);

}
