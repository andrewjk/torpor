import $watch from '../../../../../tera/view/src/watch/$watch';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import t_run_control from '../../../../../tera/view/src/render/internal/runControl';
import t_run_branch from '../../../../../tera/view/src/render/internal/runControlBranch';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import $run from '../../../../../tera/view/src/watch/$run';

const TrafficLight = {
	name: "TrafficLight",
	/**
	* @param {Node} $parent
	* @param {Node | null} $anchor
	* @param {Object} [$props]
	* @param {Object} [$slots]
	* @param {Object} [$context]
	*/
	render: ($parent, $anchor, $props, $slots, $context) => {
		/* User script */
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
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <button>Next light</button> <p>#</p> <p> You must <!> </p> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_button_1 = t_next(t_child(t_div_1));
		const t_text_1 = t_child(t_next(t_next(t_button_1)));
		const t_if_parent_1 = t_next(t_next(t_next(t_next(t_button_1))));
		const t_if_anchor_1 = t_anchor(t_next(t_child(t_if_parent_1)));

		/* @if */
		const t_if_range_1 = {};
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


		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Light is: ${t_fmt($state.light)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
		t_button_1.addEventListener("click", nextLight);
	}
}

export default TrafficLight;
