import $onmount from "../../../../src/ssr/$serverOnmount";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function NestedEmbed(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	$onmount(() => {
		window.__nestedLog.push("embed-mount");
		return () => {
			window.__nestedLog.push("embed-cleanup");
		};
	});

	/* User interface */
	t_body += `<p id="embed">Embed</p>`;

	return { body: t_body, head: t_head };
}
