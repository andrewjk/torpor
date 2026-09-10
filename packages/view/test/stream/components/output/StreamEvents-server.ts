import { $stream } from "@torpor/view/ssr";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function StreamEvents(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		messages: [] as string[],
	});

	$stream((push: (m: string) => void) => {
		const listener = (e: CustomEvent) => push(String(e.detail));
		// @ts-ignore
		document.addEventListener("stream-test", listener);
		// @ts-ignore
		return () => document.removeEventListener("stream-test", listener);
	}, (m) => {
		$state.messages.push(m);
	});

	/* User interface */
	t_body += `<ul><![>`;
	for (let m of $state.messages) {
		t_body += `<!^><li>${t_fmt(m)}</li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
