import { $stream } from "@torpor/view/ssr";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function StreamResubscribe(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		channel: "a",
		messages: [] as string[],
	});

	$stream((push: (m: string) => void) => {
		// Reading $state.channel inside the source tracks it: a change
		// unsubscribes the old listener and subscribes the new one. Capture
		// the value in a local, so the cleanup removes the listener it
		// actually added (not whatever the value is at teardown time)
		const channel = $state.channel;
		const listener = (e: CustomEvent) => push(String(e.detail));
		// @ts-ignore
		document.addEventListener(channel, listener);
		// @ts-ignore
		return () => document.removeEventListener(channel, listener);
	}, (m) => {
		$state.messages.push(m);
	});

	/* User interface */
	t_body += `<button>Switch</button> <ul><![>`;
	for (let m of $state.messages) {
		t_body += `<!^><li>${t_fmt(m)}</li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
