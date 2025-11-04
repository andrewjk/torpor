import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function TrafficLight(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

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

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <button>Next light</button> <p>#</p> <p> You must <!> </p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_button_1 = t_next(t_root_0) as HTMLButtonElement;
	const t_text_1 = t_child(t_next(t_next(t_button_1, true)));
	const t_if_parent_1 = t_next(t_next(t_next(t_next(t_button_1, true)), true)) as HTMLElement;
	let t_if_anchor_1 = t_anchor(t_next(t_child(t_next(t_next(t_next(t_next(t_button_1, true)), true))))) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let $t_if_state_1 = $watch({ index: -1 });
	let t_if_creators_1: ((t_before: Node | null) => void)[] = [];
	$run(() => {
		if ($state.light === "red") {
			t_if_creators_1[0] = (t_before) => {
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <span>STOP</span> `);
				const t_root_1 = t_root(t_fragment_1, true);
				const t_text_2 = t_next(t_next(t_root_1), true);
				t_add_fragment(t_fragment_1, t_if_parent_1, t_before, t_text_2);
				t_next(t_text_2);
			};
			$t_if_state_1.index = 0;
		}
		else if ($state.light === "orange") {
			t_if_creators_1[1] = (t_before) => {
				const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <span>SLOW DOWN</span> `);
				const t_root_2 = t_root(t_fragment_2, true);
				const t_text_3 = t_next(t_next(t_root_2), true);
				t_add_fragment(t_fragment_2, t_if_parent_1, t_before, t_text_3);
				t_next(t_text_3);
			};
			$t_if_state_1.index = 1;
		}
		else if ($state.light === "green") {
			t_if_creators_1[2] = (t_before) => {
				const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <span>GO</span> `);
				const t_root_3 = t_root(t_fragment_3, true);
				const t_text_4 = t_next(t_next(t_root_3), true);
				t_add_fragment(t_fragment_3, t_if_parent_1, t_before, t_text_4);
				t_next(t_text_4);
			};
			$t_if_state_1.index = 2;
		}
		else {
			t_if_creators_1[3] = (_) => {};
			$t_if_state_1.index = 3;
		}
	});
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		const index = $t_if_state_1.index;
		t_run_branch(t_if_region_1, () => t_if_creators_1[index](t_before));
	});

	const t_text_5 = t_next(t_next(t_next(t_next(t_next(t_button_1, true)), true)), true);
	t_event(t_button_1, "click", nextLight);
	$run(() => {
		t_text_1.textContent = `Light is: ${t_fmt($state.light)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_5);
	t_next(t_text_5);

	/**/ });
}
