import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

function Thrower(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	function boom() {
		throw new Error("child boom");
	}

	/* User interface */
	t_body += `<![>`;
	if (boom()) {
		t_body += `<!^><p>This is never rendered</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

export default function TryCatchPartial(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_try_body = t_body;
	const t_try_head = t_head;
	try {
		t_body += `<p>First</p> <![>`;
		const t_comp_1 = Thrower(undefined, $context);
		t_body += t_comp_1.body;
		t_head += t_comp_1.head;
		t_body += `<!]><!> <p>Third</p>`;
	} catch (err) {
		t_body = t_try_body;
		t_head = t_try_head;
		t_body += `<p class="error">Caught: ${t_fmt(err.message)}</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
