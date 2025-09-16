import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function TrafficLight(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
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
	t_body += ` <button>Next light</button> <p>Light is: ${t_fmt($state.light)}</p> <p> You must <![>`;
	if ($state.light === "red") {
		t_body += `<!^> <span>STOP</span> `;
	}
	else if ($state.light === "orange") {
		t_body += `<!^> <span>SLOW DOWN</span> `;
	}
	else if ($state.light === "green") {
		t_body += `<!^> <span>GO</span> `;
	}
	t_body += `<!]><!> </p> `;

	return { body: t_body, head: t_head };
}
