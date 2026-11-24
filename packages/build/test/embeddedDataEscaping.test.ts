import { expect, test } from "vite-plus/test";
import ok from "../src/response/ok";
import unprocessable from "../src/response/unprocessable";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";

const template = "<html><head>%COMPONENT_HEAD%</head><body>%COMPONENT_BODY%</body></html>";

const attack = `x' autofocus onfocus='alert(1)" </script><script>alert(2)</script>`;

function siteWith(pageServer: PageServerEndPoint) {
	const component = () => ({ body: "<p>page</p>", head: "" });
	const routes: ManifestRoute[] = [
		{
			path: "/form",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
		{
			path: "/form/~server",
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: pageServer }),
			subFolder: undefined,
		},
	];
	return createServerLoad(new Router().addPages(routes));
}

/** Everything after the rendered page body, i.e. the embedded data. */
function embedded(html: string): string {
	return html.slice(html.indexOf("<p>page</p>") + "<p>page</p>".length);
}

test("a no-JS form result that echoes user input can't inject markup", async () => {
	const load = siteWith({
		load: async () => ok({}),
		actions: {
			default: async (ev) => {
				const form = await ev.form();
				return unprocessable({ message: "Invalid", values: form });
			},
		},
	});

	const formData = new FormData();
	formData.append("name", attack);
	const req = new Request("http://localhost/form", { method: "POST", body: formData });
	const html = await (await load(new ServerEvent(req), template)).text();
	const data = embedded(html);

	// The form result rides in a JSON script, with `<` escaped so the
	// submitted value can't close it
	expect(data).toContain('<script type="application/json" id="t-form-data">');
	expect(data).not.toContain("<script>alert(2)");
	expect(data).not.toContain("<input");

	// And it still round-trips to the original value
	const json = data.match(/id="t-form-data">(.*?)<\/script>/s)![1];
	expect(JSON.parse(json).values.name).toBe(attack);
});

test("a rejected deferred value can't inject markup", async () => {
	const load = siteWith({
		load: async () =>
			ok({
				now: "here",
				later: Promise.reject(new Error(`no user ${attack}`)),
			}),
	});

	const html = await (
		await load(new ServerEvent(new Request("http://localhost/form")), template)
	).text();
	const script = html.match(/<script>__torporDeferred\.reject\((.*?)\)<\/script>/s);

	expect(script).not.toBeNull();
	expect(script![1]).not.toContain("</script>");
	expect(html).not.toContain("<script>alert(2)");
	// The message still round-trips
	expect(JSON.parse(`[${script![1]}]`)[1]).toBe(`no user ${attack}`);
});
