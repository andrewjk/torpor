import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function Await(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
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
		const t_fmt = (text: string) => (text != null ? text : "");
		let $output = "";
		$output += `<div> <![>`;
		$output += ` <p>Hmm...</p> `;
		$output += `<!]><!> <button> Guess again </button> </div>`;
		return $output;
	}

