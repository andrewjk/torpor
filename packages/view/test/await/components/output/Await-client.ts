import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_range from "../../../../src/render/popRange";
import t_push_range from "../../../../src/render/pushRange";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function Await(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
) {

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
		// @ts-ignore
		const t_root_0 = t_root(t_fragment_0, true);
		let t_await_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

		/* @await */
		const t_await_range_1 = t_range();
		t_await_range_1.index = -1;
		let t_await_token_1 = 0;
		t_run_control(t_await_range_1, t_await_anchor_1, (t_before) => {
			t_await_token_1++;
			t_run_branch(t_await_range_1, 0, () => {
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>Hmm...</p> `);
				// @ts-ignore
				const t_root_1 = t_root(t_fragment_1, true);
				// @ts-ignore
				const t_text_1 = t_next(t_next(t_root_1), true);
				t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_1);
				t_next(t_text_1);
			});
			((token) => {
				$state.guesser
				.then((_number) => {
					if (token === t_await_token_1) {
						let t_old_range_1 = t_push_range(t_await_range_1);
						t_run_branch(t_await_range_1, 1, () => {
							const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p>Is it a number?</p> `);
							// @ts-ignore
							const t_root_2 = t_root(t_fragment_2, true);
							// @ts-ignore
							const t_text_2 = t_next(t_next(t_root_2), true);
							t_add_fragment(t_fragment_2, t_fragment_0, t_before, t_text_2);
							t_next(t_text_2);
						});
						t_pop_range(t_old_range_1);
					}
				})
				.catch((ex) => {
					if (token === t_await_token_1) {
						let t_old_range_1 = t_push_range(t_await_range_1);
						t_run_branch(t_await_range_1, 2, () => {
							const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, ` <p class="error">#</p> `);
							// @ts-ignore
							const t_root_3 = t_root(t_fragment_3, true);
							const t_text_3 = t_child(t_next(t_root_3));
							// @ts-ignore
							const t_text_4 = t_next(t_next(t_root_3), true);
							$run(function setTextContent() {
								t_text_3.textContent = `Something went wrong: ${t_fmt(ex)}!`;
							});
							t_add_fragment(t_fragment_3, t_fragment_0, t_before, t_text_4);
							t_next(t_text_4);
						});
						t_pop_range(t_old_range_1);
					}
				});
			})(t_await_token_1);
		});

		const t_button_1 = t_next(t_next(t_await_anchor_1, true)) as HTMLElement;
		// @ts-ignore
		const t_text_5 = t_next(t_button_1, true);
		t_event(t_button_1, "click", () => $state.guesser = guessNumber(100));
		t_add_fragment(t_fragment_0, $parent, $anchor, t_text_5);
		t_next(t_text_5);

	}
