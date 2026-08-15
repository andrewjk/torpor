import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

function Styled2(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<span class="torp-8ewh1m">styled</span>`;

	/* Style */
	t_head += "<style id='8ewh1m'>span.torp-8ewh1m { color: blue; } </style>";

	return { body: t_body, head: t_head };
}

export default function ErrorHeadDiscard(
	$props: { danger: boolean },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	function boom() {
		if ($props.danger) throw new Error("boom");
		return true;
	}

	/* User interface */
	const t_try_body = t_body;
	const t_try_head = t_head;
	try {
		t_body += `<![>`;
		const t_comp_1 = Styled2(undefined, $context);
		t_body += t_comp_1.body;
		t_head += t_comp_1.head;
		t_body += `<!]><!> <![>`;
		if (boom()) {
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
