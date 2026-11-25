import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function IfHeaderSymbols(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ text: "{};()" });

	/* User interface */
	t_body += `<![>`;
	if ($state.text === "{};()") {
		t_body += `<!^0><p>literal</p>`;
	}
	else {
		t_body += `<!^1><p>other</p>`;
	}
	t_body += `<!]><!> <![>`;
	if (/[{};]/.test($state.text)) {
		t_body += `<!^0><p>regex</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
