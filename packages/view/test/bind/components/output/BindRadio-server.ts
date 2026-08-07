import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function BindRadio(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ color: "red" });

	/* User interface */
	t_body += `<label><input type="radio" name="color" value="red" group="${t_attr($state.color) || ""}"> Red </label> <label><input type="radio" name="color" value="green" group="${t_attr($state.color) || ""}"> Green </label> <label><input type="radio" name="color" value="blue" group="${t_attr($state.color) || ""}"> Blue </label> <p>Selected: ${t_fmt($state.color)}</p>`;

	return { body: t_body, head: t_head };
}
