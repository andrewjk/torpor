import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TransitionMount(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	function enter() {
		return {
			keyframes: [{ opacity: "0" }, { opacity: "1" }],
			options: { duration: 100 },
		};
	}

	/* User interface */
	t_body += `<div class="fade">Hello</div>`;

	return { body: t_body, head: t_head };
}
