import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function NestedBoundaries(
	$props: { danger: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
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
		t_body += `<![>`;
		const t_try_body = t_body;
		const t_try_head = t_head;
		try {
			t_body += `<p>Inner: ${t_fmt(maybeThrow())}</p>`;
		} catch (inner) {
			t_body = t_try_body;
			t_head = t_try_head;
			t_body += `<p class="inner">Inner caught: ${t_fmt(inner.message)}</p>`;
		}
		t_body += `<!]><!>`;
	} catch (outer) {
		t_body = t_try_body;
		t_head = t_try_head;
		t_body += `<p class="outer">Outer caught: ${t_fmt(outer.message)}</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
