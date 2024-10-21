import type { ServerSlotRender } from "@tera/view";

const Await = {
	/**
	 * The component's name.
	 */
	name: "Await",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		/* User script */
		const $watch = (obj: Record<PropertyKey, any>) => obj;
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
			let $output = "";
			/* User interface */
			const t_fmt = (text: string) => (text != null ? text : "");
			$output += `<div> <![>`;
			$output += ` <p>Hmm...</p> `;
			$output += `<!]><!> <button> Guess again </button> </div>`;
			return $output;
		}
	}
	
	export default Await;
