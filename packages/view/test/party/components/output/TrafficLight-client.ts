import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function TrafficLight(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
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

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <button>Next light</button> <p>#</p> <p> You must <!> </p> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_button_1 = t_next(t_root_0) as HTMLElement;
	const t_text_1 = t_child(t_next(t_next(t_button_1, true)));
	const t_if_parent_1 = t_next(t_next(t_next(t_next(t_button_1, true)), true)) as HTMLElement;
	let t_if_anchor_1 = t_anchor(t_next(t_child(t_next(t_next(t_next(t_next(t_button_1, true)), true))))) as HTMLElement;

	/* @if */
	const t_if_range_1 = t_range();
	let $t_if_state_1 = $watch({ creator: (_: Node | null) => {} });
	$run(function runIf() {
		if ($state.light === "red") {
			$t_if_state_1.creator = (t_before) => {
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <span>STOP</span> `);
				// @ts-ignore
				const t_root_1 = t_root(t_fragment_1, true);
				// @ts-ignore
				const t_text_2 = t_next(t_next(t_root_1), true);
				t_add_fragment(t_fragment_1, t_if_parent_1, t_before, t_text_2);
				t_next(t_text_2);
			}
		}
		else if ($state.light === "orange") {
			$t_if_state_1.creator = (t_before) => {
				const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <span>SLOW DOWN</span> `);
				// @ts-ignore
				const t_root_2 = t_root(t_fragment_2, true);
				// @ts-ignore
				const t_text_3 = t_next(t_next(t_root_2), true);
				t_add_fragment(t_fragment_2, t_if_parent_1, t_before, t_text_3);
				t_next(t_text_3);
			}
		}
		else if ($state.light === "green") {
			$t_if_state_1.creator = (t_before) => {
				const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <span>GO</span> `);
				// @ts-ignore
				const t_root_3 = t_root(t_fragment_3, true);
				// @ts-ignore
				const t_text_4 = t_next(t_next(t_root_3), true);
				t_add_fragment(t_fragment_3, t_if_parent_1, t_before, t_text_4);
				t_next(t_text_4);
			}
		}
		else {
			$t_if_state_1.creator = (t_before) => {
			}
		}
	});
	t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
		t_run_branch(t_if_range_1, () => $t_if_state_1.creator(t_before));
	});

	// @ts-ignore
	const t_text_5 = t_next(t_next(t_next(t_next(t_next(t_button_1, true)), true)), true);
	t_event(t_button_1, "click",
	nextLight
);
$run(function setAttributes() {
	t_text_1.textContent = `Light is: ${t_fmt($state.light)}`;
});
t_add_fragment(t_fragment_0, $parent, $anchor, t_text_5);
t_next(t_text_5);

}
