const Await = {
	name: "Await",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
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
			const t_fmt = (text) => text != null ? text : "";
			$output += `<div> <![>`;
			$output += ` <p>Hmm...</p> `;
			$output += `<!]><!> <button> Guess again </button> </div>`;
			return $output;
		}
	}
	
	export default Await;
