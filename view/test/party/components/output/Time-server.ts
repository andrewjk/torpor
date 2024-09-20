import type SlotRender from "@tera/view";

const Time = {
	/**
	 * The component's name.
	 */
	name: "Time",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj) => obj;
		const $run = (fn) => null;
		let $state = $watch({
			time: new Date().toLocaleTimeString()
		});

		$run(() => {
			const timer = setInterval(() => {
				$state.time = new Date().toLocaleTimeString();
			}, 1000);

			return () => clearInterval(timer);
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<p>Current time: ${t_fmt($state.time)}</p>`;
		return $output;
	}
}

export default Time;
