import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
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

export default function TrafficLight(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	const TRAFFIC_LIGHTS = ["red", "orange", "green"];
	let $state = $watch({
		lightIndex: 0,
		get light() {
			return TRAFFIC_LIGHTS[this.lightIndex];
		}
	});

	function nextLight() {
		$state.lightIndex = ($state.lightIndex + 1) % TRAFFIC_LIGHTS.length;
	}

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<button>Next light</button> <p>#</p> <p> You must <!></p>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_button_1 = t_root_0 as HTMLButtonElement;
	const t_text_1 = t_child(t_next(t_next(t_button_1, true)));
	const t_p_1 = t_next(t_next(t_next(t_next(t_button_1, true)), true)) as HTMLElement;
	let t_if_anchor_1 = t_anchor(t_next(t_child(t_p_1))) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($state.light === "red") {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<span>STOP</span>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_span_1 = t_root_1 as HTMLSpanElement;
			t_add_element(t_span_1, t_p_1, t_before);
			t_next(t_span_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else if ($state.light === "orange") {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<span>SLOW DOWN</span>`);
			const t_root_2 = t_root_el(t_fragment_2);
			const t_span_2 = t_root_2 as HTMLSpanElement;
			t_add_element(t_span_2, t_p_1, t_before);
			t_next(t_span_2);
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
		else if ($state.light === "green") {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 2)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<span>GO</span>`);
			const t_root_3 = t_root_el(t_fragment_3);
			const t_span_3 = t_root_3 as HTMLSpanElement;
			t_add_element(t_span_3, t_p_1, t_before);
			t_next(t_span_3);
			t_pop_region(t_old_region);
			t_if_index_1 = 2;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 3)) return;
			t_if_index_1 = 3;
		}
	});

	t_event(t_button_1, "click", nextLight);
	$run(() => {
		t_text_1.textContent = `Light is: ${t_fmt($state.light)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_p_1, t_root_0);
	t_next(t_p_1);

}
