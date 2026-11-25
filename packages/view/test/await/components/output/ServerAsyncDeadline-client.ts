import $async from "../../../../src/watch/$async";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_await from "../../../../src/render/runAwait";
import t_skip from "../../../../src/render/nodeSkip";
import type SlotRender from "../../../../src/types/SlotRender";

function Child(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		get data() {
			return $async(() => delay("child data", 80), { source: "server", timeout: 150 });
		},
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_await_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @await */
	const t_await_region_1 = t_region();
	t_run_await(t_await_region_1, t_await_anchor_1, (t_before) => {
		const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>#</p>`);
		const t_root_1 = t_root_el(t_fragment_1);
		const t_p_1 = t_root_1 as HTMLElement;
		const t_text_1 = t_child(t_p_1);
		$run(() => {
			t_text_1.textContent = `Child: ${t_fmt($state.data)}`;
		});
		t_add_element(t_p_1, t_fragment_0, t_before);
	}, (t_before) => {
		const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>Child loading...</p>`);
		const t_root_2 = t_root_el(t_fragment_2);
		const t_p_2 = t_root_2 as HTMLElement;
		t_add_element(t_p_2, t_fragment_0, t_before);
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_await_anchor_1, t_root_0);

}

export default function Parent(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		get data() {
			return $async(() => delay("parent data", 80), { source: "server", timeout: 150 });
		},
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_await_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @await */
	const t_await_region_1 = t_region();
	t_run_await(t_await_region_1, t_await_anchor_1, (t_before) => {
		const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<p>#</p> <!>`);
		const t_root_1 = t_root(t_fragment_1);
		const t_text_1 = t_child(t_root_1);
		let t_comp_anchor_1 = t_anchor(t_skip(t_root_1, 2, 1)) as HTMLElement;

		/* @component */
		Child(t_fragment_1, t_comp_anchor_1, undefined, $context);

		$run(() => {
			t_text_1.textContent = `Parent: ${t_fmt($state.data)}`;
		});
		t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_comp_anchor_1, t_root_1);
	}, (t_before) => {
		const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>Parent loading...</p>`);
		const t_root_2 = t_root_el(t_fragment_2);
		const t_p_1 = t_root_2 as HTMLElement;
		t_add_element(t_p_1, t_fragment_0, t_before);
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_await_anchor_1, t_root_0);

}

function delay(value: string, ms: number): Promise<string> {
	return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
