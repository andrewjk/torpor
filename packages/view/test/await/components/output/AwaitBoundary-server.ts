import $async from "../../../../src/ssr/$serverAsync";
import $watch from "../../../../src/ssr/$serverWatch";
import t_await_server from "../../../../src/ssr/runServerAwait";
import t_fmt from "../../../../src/ssr/formatText";
import { serverFlush as t_server_flush } from "../../../../src/ssr/serverSentinels";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AwaitRapid(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	return t_server_flush(async () => {
		let t_body = "";
		let t_head = "";

		let $state = $watch({
			version: 0,
			get data() {
				return $async(() => {
					// Read version synchronously so the computed tracks it
					const version = $state.version;
					// v1 is deliberately slow, so it is still in flight when the
					// next change lands
					const delay = version === 1 ? 100 : 10;
					return new Promise((resolve) => {
						setTimeout(() => resolve("loaded v" + version), delay);
					});
				});
			},
		});

		function refresh() {
			$state.version++;
		}

		/* User interface */
		const t_await_1 = await t_await_server("0", async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>Result: ${t_fmt($state.data)}</p>`;
			return { body: t_body, head: t_head };
		}, async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>Loading...</p>`;
			return { body: t_body, head: t_head };
		});
		t_body += t_await_1.body;
		t_head += t_await_1.head;
		t_body += ` <button>refresh</button>`;

		return { body: t_body, head: t_head };
	});
}
