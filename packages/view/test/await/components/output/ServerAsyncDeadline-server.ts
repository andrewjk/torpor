import $async from "../../../../src/ssr/$serverAsync";
import $watch from "../../../../src/ssr/$serverWatch";
import t_await_server from "../../../../src/ssr/runServerAwait";
import t_fmt from "../../../../src/ssr/formatText";
import { renderContext as t_render_context } from "../../../../src/ssr/renderContext";
import { serverFlush as t_server_flush } from "../../../../src/ssr/serverSentinels";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

async function Child(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	$context = t_render_context($context);
	return t_server_flush(async () => {
		let t_body = "";
		let t_head = "";

		let $state = $watch({
			get data() {
				return $async(() => delay("child data", 80), { source: "server", timeout: 150 });
			},
		});

		/* User interface */
		const t_await_1 = await t_await_server("0", async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>Child: ${t_fmt($state.data)}</p>`;
			return { body: t_body, head: t_head };
		}, async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>Child loading...</p>`;
			return { body: t_body, head: t_head };
		}, $context);
		t_body += t_await_1.body;
		t_head += t_await_1.head;

		return { body: t_body, head: t_head };
	});
}

export default async function Parent(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	$context = t_render_context($context);
	return t_server_flush(async () => {
		let t_body = "";
		let t_head = "";

		let $state = $watch({
			get data() {
				return $async(() => delay("parent data", 80), { source: "server", timeout: 150 });
			},
		});

		/* User interface */
		const t_await_1 = await t_await_server("0", async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>Parent: ${t_fmt($state.data)}</p> <![>`;
			const t_comp_1 = await Child(undefined, $context);
			t_body += t_comp_1.body;
			t_head += t_comp_1.head;
			t_body += `<!]><!>`;
			return { body: t_body, head: t_head };
		}, async () => {
			let t_body = "";
			let t_head = "";
			t_body += `<p>Parent loading...</p>`;
			return { body: t_body, head: t_head };
		}, $context);
		t_body += t_await_1.body;
		t_head += t_await_1.head;

		return { body: t_body, head: t_head };
	});
}

function delay(value: string, ms: number): Promise<string> {
	return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
