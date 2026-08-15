import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function TryHydrationMismatch(
	$props: { danger: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	function boom() {
		if ($props.danger) throw new Error("boom");
		return "ok";
	}

	/* User interface */
	t_body += `<![>`;
	const t_try_body = t_body;
	const t_try_head = t_head;
	try {
		t_body += `<p>safe</p> <p>${t_fmt(boom())}</p>`;
	} catch (err) {
		t_body = t_try_body;
		t_head = t_try_head;
		t_body += `<p class="error">Caught: ${t_fmt(err.message)}</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
