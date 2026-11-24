import { expect, test } from "vite-plus/test";
import ok from "../src/response/ok";
import unprocessable from "../src/response/unprocessable";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageState from "../src/types/PageState";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";

const template = "<html><head>%COMPONENT_HEAD%</head><body>%COMPONENT_BODY%</body></html>";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A component that renders what it sees in `$context.$page`, after an
 * await, so a concurrent request has the chance to change it in between.
 */
const component = async (_: unknown, { $page }: { $page: PageState }) => {
	await wait(5);
	return {
		body: `<p>url=${$page.url.pathname}${$page.url.search} form=${JSON.stringify($page.form ?? null)}</p>`,
		head: "",
	};
};

const routes: ManifestRoute[] = [
	{
		path: "/slow",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component } }),
		subFolder: undefined,
	},
	{
		path: "/slow/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () =>
			Promise.resolve({
				default: {
					load: async () => {
						await wait(30);
						return ok({});
					},
				},
			}),
		subFolder: undefined,
	},
	{
		path: "/fast",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component } }),
		subFolder: undefined,
	},
	{
		path: "/form",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component } }),
		subFolder: undefined,
	},
	{
		path: "/form/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () =>
			Promise.resolve({
				default: {
					load: async () => ok({}),
					actions: {
						default: async (ev: any) =>
							unprocessable({ message: "Invalid", values: await ev.form() }),
					},
				},
			}),
		subFolder: undefined,
	},
];

const load = createServerLoad(new Router().addPages(routes));

function get(path: string): ServerEvent {
	return new ServerEvent(new Request(`http://localhost${path}`));
}

function rendered(html: string): string | undefined {
	return html.match(/<p>(.*?)<\/p>/)?.[1];
}

test("concurrent requests each render their own $page", async () => {
	// The slow request is still loading when the fast one arrives and sets
	// its own url
	const [slow, fast] = await Promise.all([
		load(get("/slow?user=alice"), template).then((r) => r.text()),
		wait(5)
			.then(() => load(get("/fast?user=bob"), template))
			.then((r) => r.text()),
	]);

	expect(rendered(slow)).toBe("url=/slow?user=alice form=null");
	expect(rendered(fast)).toBe("url=/fast?user=bob form=null");
});

test("a form result isn't rendered into later requests", async () => {
	const formData = new FormData();
	formData.append("name", "alice's secret");
	const post = new ServerEvent(
		new Request("http://localhost/form", { method: "POST", body: formData }),
	);
	const postHtml = await (await load(post, template)).text();
	// The form result is rendered for the request that posted it...
	expect(rendered(postHtml)).toContain("alice's secret");

	// ...but not for the next request, from anyone
	const next = await (await load(get("/fast"), template)).text();
	expect(rendered(next)).toBe("url=/fast form=null");
});
