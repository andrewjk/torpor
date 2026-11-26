import t_attr_if from "../../../../src/ssr/buildAttribute";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Links(
	$props: { href: string; items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<a id="static" href="/static">Static</a> <a id="dynamic" ${t_attr_if("href", $props.href)}>Dynamic</a> <a id="external" href="https://example.com/x">External</a> <a id="hash" href="#top">Hash</a> <img src="/logo.png"> <form action="/save"></form> <ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li><a class="item" ${t_attr_if("href", "/items/" + item)}>${t_fmt(item)}</a></li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
