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

export default function Await(
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

	// Use the $watch function to declare reactive state
	let $state = $watch({})

	// This is an async function
	let attempt = 0
	$state.guesser = guessNumber(100)
	async function guessNumber(ms) {
		attempt++
		return new Promise((ok, err) => {
			return setTimeout(
				attempt % 3 === 0
				? () => err("uh oh")
				: () => ok(Math.floor(Math.random() * 10 + 1)),
				ms)
			})
		}

		/* User interface */
		const t_fragments: DocumentFragment[] = [];

		const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> <button> Guess again </button> `);
		const t_root_0 = t_root(t_fragment_0, true);
		let t_await_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

		/* @await */
		const t_await_region_1 = t_region();
		let $t_await_state_1 = $watch({ index: -1 });
		let t_await_creators_1: ((t_before: Node | null) => void)[] = [];
		let t_await_vars_1 = { t_token: 0 };
		$run(() => {
			t_await_creators_1[0] = (t_before) => {
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>Hmm...</p> `);
				const t_root_1 = t_root(t_fragment_1, true);
				const t_text_1 = t_next(t_next(t_root_1), true);
				t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_1);
				t_next(t_text_1);
			};
			$t_await_state_1.index = 0;
			t_await_vars_1.t_token++;
			((t_token) => {
				$state.guesser
				.then((_number) => {
					if (t_token === t_await_vars_1.t_token) {
						t_await_creators_1[1] = (t_before) => {
							const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p>Is it a number?</p> `);
							const t_root_2 = t_root(t_fragment_2, true);
							const t_text_2 = t_next(t_next(t_root_2), true);
							t_add_fragment(t_fragment_2, t_fragment_0, t_before, t_text_2);
							t_next(t_text_2);
						};
						$t_await_state_1.index = 1;
					}
				})
				.catch((ex) => {
					if (t_token === t_await_vars_1.t_token) {
						t_await_creators_1[2] = (t_before) => {
							const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <p class="error">#</p> `);
							const t_root_3 = t_root(t_fragment_3, true);
							const t_text_3 = t_child(t_next(t_root_3));
							const t_text_4 = t_next(t_next(t_root_3), true);
							$run(() => {
								t_text_3.textContent = `Something went wrong: ${t_fmt(ex)}!`;
							});
							t_add_fragment(t_fragment_3, t_fragment_0, t_before, t_text_4);
							t_next(t_text_4);
						};
						$t_await_state_1.index = 2;
					}
				});
			})(t_await_vars_1.t_token);
		});
		t_run_control(t_await_region_1, t_await_anchor_1, (t_before) => {
			t_run_branch(t_await_region_1, () => t_await_creators_1[$t_await_state_1.index](t_before));
		});

		const t_button_1 = t_next(t_next(t_await_anchor_1, true)) as HTMLElement;
		const t_text_5 = t_next(t_button_1, true);
		t_event(t_button_1, "click", () => $state.guesser = guessNumber(100));
		t_add_fragment(t_fragment_0, $parent, $anchor, t_text_5);
		t_next(t_text_5);

		/**/ });
	}
