import $watch from '../../../../../tera/view/src/watch/$watch';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import t_run_control from '../../../../../tera/view/src/render/internal/runControl';
import t_run_branch from '../../../../../tera/view/src/render/internal/runControlBranch';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_push_range from '../../../../../tera/view/src/render/internal/pushRange';
import t_pop_range from '../../../../../tera/view/src/render/internal/popRange';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import $run from '../../../../../tera/view/src/watch/$run';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';

const Await = {
	name: "Await",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User script */
		// Use the $watch function to declare reactive state
		const $state = $watch({})

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
			const t_fragments = [];

			const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> <button> Guess again </button> </div>`);
			const t_div_1 = t_root(t_fragment_0);
			const t_await_anchor_1 = t_anchor(t_next(t_child(t_div_1)));

			/* @await */
			const t_await_range_1 = { index: -1 };
			let t_await_token_1 = 0;
			t_run_control(t_await_range_1, t_await_anchor_1, (t_before) => {
				t_await_token_1++;
				t_run_branch(t_await_range_1, 0, () => {
					const t_fragment_1 = t_fragment(t_fragments, 1, ` <p>Hmm...</p> `);
					const t_root_1 = t_root(t_fragment_1);
					const t_text_1 = t_next(t_next(t_root_1));
					t_add_fragment(t_fragment_1, t_div_1, t_before);
					t_next(t_text_1);
				});
				((token) => {
					$state.guesser
					.then((number) => {
						if (token === t_await_token_1) {
							let t_old_range_1 = t_push_range(t_await_range_1);
							t_run_branch(t_await_range_1, 1, () => {
								const t_fragment_2 = t_fragment(t_fragments, 2, ` <p>Is it a number?</p> `);
								const t_root_2 = t_root(t_fragment_2);
								const t_text_2 = t_next(t_next(t_root_2));
								t_add_fragment(t_fragment_2, t_div_1, t_before);
								t_next(t_text_2);
							});
							t_pop_range(t_old_range_1);
						}
					})
					.catch((ex) => {
						if (token === t_await_token_1) {
							let t_old_range_1 = t_push_range(t_await_range_1);
							t_run_branch(t_await_range_1, 2, () => {
								const t_fragment_3 = t_fragment(t_fragments, 3, ` <p class="error">#</p> `);
								const t_root_3 = t_root(t_fragment_3);
								const t_text_3 = t_child(t_next(t_root_3));
								const t_text_4 = t_next(t_next(t_root_3));
								$run(function setTextContent() {
									t_text_3.textContent = `Something went wrong: ${t_fmt(ex)}!`;
								});
								t_add_fragment(t_fragment_3, t_div_1, t_before);
								t_next(t_text_4);
							});
							t_pop_range(t_old_range_1);
						}
					});
				})(t_await_token_1);
			});

			const t_button_1 = t_next(t_next(t_await_anchor_1));

			t_apply_props(t_div_1, $props, []);
			t_add_fragment(t_fragment_0, $parent, $anchor);
			t_button_1.addEventListener("click", () => $state.guesser = guessNumber(100));
		}
	}
	
	export default Await;
