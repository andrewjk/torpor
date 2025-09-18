import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Await(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
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
		t_body += ` <![>`;
		t_body += ` <p>Hmm...</p> `;
		t_body += `<!]><!> <button> Guess again </button> `;

		return { body: t_body, head: t_head };
	}
