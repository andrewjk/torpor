import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ErrorBlock(
	$props: { danger: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return true;
	}

	/* User interface */
	const t_try_body = t_body;
	const t_try_head = t_head;
	try {
		t_body += `<![>`;
		if (maybeThrow()) {
			t_body += `<!^><p>All good</p>`;
		}
		t_body += `<!]><!>`;

	} catch (err) {
		t_body = t_try_body;
		t_head = t_try_head;
		/* User interface error */
		t_body += `<p class="error">Oops: ${t_fmt(err.message)}</p>`;
	}

	return { body: t_body, head: t_head };
}
