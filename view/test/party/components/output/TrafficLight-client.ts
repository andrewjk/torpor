import { $run } from "@tera/view";
import { $watch } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_child } from "@tera/view";
import { t_event } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_range } from "@tera/view";
import { t_root } from "@tera/view";
import { t_run_branch } from "@tera/view";
import { t_run_control } from "@tera/view";

export default function TrafficLight(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
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

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <button>Next light</button> <p>#</p> <p> You must <!> </p> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_button_1 = t_next(t_child(t_div_1)) as HTMLElement;
	const t_text_1 = t_child(t_next(t_next(t_button_1)));
	const t_if_parent_1 = t_next(t_next(t_next(t_next(t_button_1)))) as HTMLElement;
	const t_if_anchor_1 = t_anchor(t_next(t_child(t_if_parent_1))) as HTMLElement;

	/* @if */
	const t_if_range_1 = t_range();
	t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
		if ($state.light === "red") {
			t_run_branch(t_if_range_1, 0, () => {
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <span>STOP</span> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_text_2 = t_next(t_next(t_root_1));
				t_add_fragment(t_fragment_1, t_if_parent_1, t_before);
				t_next(t_text_2);
			});
		}
		else if ($state.light === "orange") {
			t_run_branch(t_if_range_1, 1, () => {
				const t_fragment_2 = t_fragment(t_fragments, 2, ` <span>SLOW DOWN</span> `);
				const t_root_2 = t_root(t_fragment_2);
				const t_text_3 = t_next(t_next(t_root_2));
				t_add_fragment(t_fragment_2, t_if_parent_1, t_before);
				t_next(t_text_3);
			});
		}
		else if ($state.light === "green") {
			t_run_branch(t_if_range_1, 2, () => {
				const t_fragment_3 = t_fragment(t_fragments, 3, ` <span>GO</span> `);
				const t_root_3 = t_root(t_fragment_3);
				const t_text_4 = t_next(t_next(t_root_3));
				t_add_fragment(t_fragment_3, t_if_parent_1, t_before);
				t_next(t_text_4);
			});
		}
		else {
			t_run_branch(t_if_range_1, 3, () => {
			});
		}
	});

	t_event(t_button_1, "click", nextLight);
	$run(function setTextContent() {
		t_text_1.textContent = `Light is: ${t_fmt($state.light)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

