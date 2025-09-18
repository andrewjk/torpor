import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function PickPill(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
	let $state = $watch({
		picked: "red"
	});

	/* User interface */
	t_body += ` <div>Picked: ${t_fmt($state.picked)}</div> <input id="blue-pill" group="${t_attr($state.picked) || ""}" type="radio" value="blue"> <label for="blue-pill">Blue pill</label> <input id="red-pill" group="${t_attr($state.picked) || ""}" type="radio" value="red"> <label for="red-pill">Red pill</label> `;

	return { body: t_body, head: t_head };
}
