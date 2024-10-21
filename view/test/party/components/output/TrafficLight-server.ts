import type { SlotRender } from "@tera/view";

const TrafficLight = {
	/**
	 * The component's name.
	 */
	name: "TrafficLight",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj: Record<PropertyKey, any>) => obj;
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
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <button>Next light</button> <p>Light is: ${t_fmt($state.light)}</p> <p> You must <![>`;
		if ($state.light === "red") {
			$output += ` <span>STOP</span> `;
		}
		else if ($state.light === "orange") {
			$output += ` <span>SLOW DOWN</span> `;
		}
		else if ($state.light === "green") {
			$output += ` <span>GO</span> `;
		}
		$output += `<!]><!> </p> </div>`;
		return $output;
	}
}

export default TrafficLight;
