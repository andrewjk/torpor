import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

interface Props {
	/** The value to switch on */
	value: number
}

/**
 * A component with a switch statement in it.
 */
export default function Switch(
	$props: Props,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
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
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
