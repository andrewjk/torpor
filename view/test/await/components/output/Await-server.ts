const Await = {
	name: "Await",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		const $watch = (obj) => obj;
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
			let $output = "";
			const t_fmt = (text) => text != null ? text : "";
			/* User interface */
			$output += `<div> <![>`;
			$output += ` <p>Hmm...</p> `;
			$output += `<!]><!> <button> Guess again </button> </div>`;
			return $output;
		}
	}
	
	export default Await;
