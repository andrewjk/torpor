import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function TrafficLight(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
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

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
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

