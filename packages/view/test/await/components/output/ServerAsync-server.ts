import $async from "../../../../src/ssr/$serverAsync";
import $watch from "../../../../src/ssr/$serverWatch";
import t_await_server from "../../../../src/ssr/runServerAwait";
import t_fmt from "../../../../src/ssr/formatText";
import { serverFlush as t_server_flush } from "../../../../src/ssr/serverSentinels";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ServerAsyncMixed(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	return t_server_flush(async () => {
		let t_body = "";
		let t_head = "";

		let $state = $watch({
			get serverData() {
				return $async(() => Promise.resolve("from server"), { source: "server" });
			},
			get clientData() {
				return $async(() => Promise.resolve("from client"));
			},
		});

		/* User interface */
		const t_await_1 = await t_await_server("0", async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>${t_fmt($state.serverData)} / ${t_fmt($state.clientData)}</p>`;
			return { body: t_body, head: t_head };
		}, async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>Loading mixed...</p>`;
			return { body: t_body, head: t_head };
		});
		t_body += t_await_1.body;
		t_head += t_await_1.head;

		return { body: t_body, head: t_head };
	});
}
