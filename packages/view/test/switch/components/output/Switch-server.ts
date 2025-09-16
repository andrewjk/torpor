import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

/**
 * A component with a switch statement in it.
 */
export default function Switch(
	$props: {
		/** The value to switch on */
		value: number
	},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	switch ($props.value) {
		case 1: {
			t_body += `<!^> <p> A small value. </p> `;
			break;
		}
		case 100: {
			t_body += `<!^> <p> A large value. </p> `;
			break;
		}
		default: {
			t_body += `<!^> <p> Another value. </p> `;
			break;
		}
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
