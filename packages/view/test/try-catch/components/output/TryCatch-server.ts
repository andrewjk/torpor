import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TryCatch(
	$props: { danger: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	/* User interface */
	t_body += `<![>`;
	const t_try_body = t_body;
	const t_try_head = t_head;
	try {
		const value = maybeThrow();
		t_body += `<p>Value: ${t_fmt(value)}</p>`;
	} catch (err) {
		t_body = t_try_body;
		t_head = t_try_head;
		t_body += `<p class="error">Caught: ${t_fmt(err.message)}</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
