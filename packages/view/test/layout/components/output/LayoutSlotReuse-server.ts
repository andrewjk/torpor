import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Page(
	$props: any,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ count: 0 });

	/* User interface */
	t_body += `<p>The count is ${t_fmt($props.count)}.</p> <button>Increment</button> <form><input type="number" name="count"> <button type="submit">Set via server</button></form> <![>`;
	if ($props?.form?.message) {
		t_body += `<!^><p style="color: green">${t_fmt($props.form.message)}</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
