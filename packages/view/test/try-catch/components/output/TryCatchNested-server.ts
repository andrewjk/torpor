import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function TryCatchNested(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	function boom() {
		throw new Error("inner boom");
	}

	/* User interface */
	t_body += `<![>`;
	const t_try_body = t_body;
	const t_try_head = t_head;
	try {
		t_body += `<![>`;
		const t_try_body = t_body;
		const t_try_head = t_head;
		try {
			const x = boom();
			t_body += `<p>Inner ok</p>`;
		} catch (inner) {
			t_body = t_try_body;
			t_head = t_try_head;
			t_body += `<p>Inner caught: ${t_fmt(inner.message)}</p>`;
		}
		t_body += `<!]><!>`;
	} catch (outer) {
		t_body = t_try_body;
		t_head = t_try_head;
		t_body += `<p>Outer caught: ${t_fmt(outer.message)}</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
