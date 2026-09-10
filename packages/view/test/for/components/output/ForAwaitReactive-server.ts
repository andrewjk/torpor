import t_await_server from "../../../../src/ssr/runServerAwait";
import t_fmt from "../../../../src/ssr/formatText";
import { serverFlush as t_server_flush } from "../../../../src/ssr/serverSentinels";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForAwaitReactive(
	$props: { ids: number[]; loaded: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	return t_server_flush(async () => {
		let t_body = "";
		let t_head = "";

		/* User interface */
		t_body += `<ul><![>`;
		for (let id of $props.ids) {
			t_body += `<!^>`;
			const t_await_1 = await t_await_server("0", async () => {
				let t_body = "";
				let t_head = "";
				t_body += `<li class="ok">${t_fmt(id)} ${t_fmt($props.loaded)}</li>`;
				return { body: t_body, head: t_head };
			}, async () => {
				let t_body = "";
				let t_head = "";
				t_body += `<li class="loading">${t_fmt(id)} loading</li>`;
				return { body: t_body, head: t_head };
			});
			t_body += t_await_1.body;
			t_head += t_await_1.head;
		}
		t_body += `<!]><!></ul> <footer>after</footer>`;

		return { body: t_body, head: t_head };
	});
}
