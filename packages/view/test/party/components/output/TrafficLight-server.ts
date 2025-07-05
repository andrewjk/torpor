import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function TrafficLight(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
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
	let $output = "";
	$output += ` <button>Next light</button> <p>Light is: ${t_fmt($state.light)}</p> <p> You must <![>`;
	if ($state.light === "red") {
		$output += `<!^> <span>STOP</span> `;
	}
	else if ($state.light === "orange") {
		$output += `<!^> <span>SLOW DOWN</span> `;
	}
	else if ($state.light === "green") {
		$output += `<!^> <span>GO</span> `;
	}
	$output += `<!]><!> </p> `;

	return $output;
}
