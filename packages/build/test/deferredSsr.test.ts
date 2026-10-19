import { expect, test } from "vite-plus/test";
import ok from "../src/response/ok";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const template = `<html><head>%COMPONENT_HEAD%</head><body><div id="app">%COMPONENT_BODY%</div></body></html><script type="module" src="/client.js"></script>`;

test("SSR streams the page before deferred server data resolves", async () => {
	const later = deferred<string>();
	const load: PageServerEndPoint["load"] = async () => ok({ now: "here", later: later.promise });
	const component = ($props: { data: Record<string, any> }) => ({
		body: `<p>${$props.data.now}</p>`,
		head: "",
	});
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
			endPoint: () => Promise.resolve({ default: { load } }),
			subFolder: undefined,
		},
	];
	const serverLoad = createServerLoad(new Router().addPages(routes));
	const response = await serverLoad(
		new ServerEvent(new Request("http://localhost/slow")),
		template,
	);

	expect(response.headers.get("Content-Type")).toContain("text/html");
	const reader = response.body!.getReader();
	const decoder = new TextDecoder();

	// The critical data renders immediately, with the deferred path announced
	const first = decoder.decode((await reader.read()).value);
	expect(first).toContain("<p>here</p>");
	expect(first).toContain('"deferred":[{"id":"d0","index":0,"path":["later"]}]');
	expect(first).toContain("__torporDeferred");
	expect(first).not.toContain("eventually");

	later.resolve("eventually");
	let rest = "";
	while (true) {
		const chunk = await reader.read();
		if (chunk.done) break;
		rest += decoder.decode(chunk.value);
	}
	expect(rest).toContain('__torporDeferred.resolve("d0","eventually")');
	// The resolve script runs inside the body, before the client module
	// script that starts hydration
	const resolveAt = rest.indexOf('__torporDeferred.resolve("d0","eventually")');
	const bodyEndAt = rest.indexOf("</body>");
	const clientScriptAt = rest.indexOf('src="/client.js"');
	expect(resolveAt).toBeGreaterThan(-1);
	expect(bodyEndAt).toBeGreaterThan(resolveAt);
	expect(clientScriptAt).toBeGreaterThan(bodyEndAt);
});
