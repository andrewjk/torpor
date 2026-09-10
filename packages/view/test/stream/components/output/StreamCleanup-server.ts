import { $stream } from "@torpor/view/ssr";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function StreamCleanup(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		last: "",
	});

	$stream((push: (m: string) => void) => {
		const listener = (e: CustomEvent) => push(String(e.detail));
		// @ts-ignore
		document.addEventListener("stream-test", listener);
		// @ts-ignore
		return () => document.removeEventListener("stream-test", listener);
	}, (m) => {
		(window as any).__streamLog.push(m);
		$state.last = m;
	});

	/* User interface */
	t_body += `<p>Last: ${t_fmt($state.last)}</p>`;

	return { body: t_body, head: t_head };
}
