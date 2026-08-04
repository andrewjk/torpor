import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function AwaitResolved(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		data: Promise.resolve("loaded data")
	});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	let t_await_anchor_1 = t_anchor(t_root(t_fragment_0)) as HTMLElement;

	/* @await */
	const t_await_region_1 = t_region();
	let t_await_token_1 = 0;
	let t_await_index_1 = -1;
	t_run_control(t_await_region_1, t_await_anchor_1, (t_before) => {
		if (!t_run_branch(t_await_region_1, t_await_index_1, 0)) return;
		const t_new_region = t_region();
		const t_old_control_region = t_push_region(t_await_region_1);
		const t_old_region = t_push_region(t_new_region, true);
		const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p>Loading...</p>`);
		const t_p_1 = t_root_el(t_fragment_1) as HTMLElement;
		t_add_element(t_p_1, t_fragment_0, t_before);
		t_next(t_p_1);
		t_pop_region(t_old_region);
		t_pop_region(t_old_control_region);
		t_await_index_1 = 0;
		t_await_token_1++;
		((t_token) => {
			$state.data
			.then((result) => {
				if (t_token === t_await_token_1) {
					if (!t_run_branch(t_await_region_1, t_await_index_1, 1)) return;
					const t_new_region = t_region();
					const t_old_control_region = t_push_region(t_await_region_1);
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>#</p>`);
					const t_p_2 = t_root_el(t_fragment_2) as HTMLElement;
					const t_text_1 = t_child(t_p_2);
					$run(() => {
						t_text_1.textContent = `Result: ${t_fmt(result)}`;
					});
					t_add_element(t_p_2, t_fragment_0, t_before);
					t_next(t_p_2);
					t_pop_region(t_old_region);
					t_pop_region(t_old_control_region);
					t_await_index_1 = 1;
				}
			})
			.catch((ex) => {
				if (t_token === t_await_token_1) {
					if (!t_run_branch(t_await_region_1, t_await_index_1, 2)) return;
					const t_new_region = t_region();
					const t_old_control_region = t_push_region(t_await_region_1);
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<p>#</p>`);
					const t_p_3 = t_root_el(t_fragment_3) as HTMLElement;
					const t_text_2 = t_child(t_p_3);
					$run(() => {
						t_text_2.textContent = `Error: ${t_fmt(ex)}`;
					});
					t_add_element(t_p_3, t_fragment_0, t_before);
					t_next(t_p_3);
					t_pop_region(t_old_region);
					t_pop_region(t_old_control_region);
					t_await_index_1 = 2;
				}
			});
		})(t_await_token_1);
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);

}
