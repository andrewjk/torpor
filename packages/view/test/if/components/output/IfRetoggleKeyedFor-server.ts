import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function IfRetoggle(
	$props: { mounted: boolean; sections: Record<string, { tabs: { id: number; text: string }[] }> },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	function tabs(): { id: number; text: string }[] {
		return $props.sections["admin"]?.tabs ?? [];
	}

	/* User interface */
	t_body += `<![>`;
	if ($props.mounted && tabs().length > 1) {
		t_body += `<!^><ul><![>`;
		for (let tab of tabs()) {
			t_body += `<!^><li>${t_fmt(tab.text)}</li>`;
		}
		t_body += `<!]><!></ul>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
