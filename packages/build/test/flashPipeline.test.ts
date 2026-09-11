import { expect, test } from "vite-plus/test";
import ok from "../src/response/ok";
import seeOther from "../src/response/seeOther";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import $page from "../src/state/$serverPage";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";

/**
 * A page component that renders the flash state, like a layout would. The
 * flash flows through $page (a module global), which loadView consumes.
 */
const component = () => {
	const { flash } = $page;
	const message = typeof flash?.message === "string" ? flash.message : "";
	return {
		body: message ? `<p class="flash">${message}</p>` : `<p>no flash</p>`,
		head: "",
	};
};

const pageServer: PageServerEndPoint = {
	actions: {
		save: async (event) => {
			event.flash.set("Project saved");
			return seeOther("/posts");
		},
	},
	load: async () => ok({}),
};

const routes: ManifestRoute[] = [
	{
		path: "/posts",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component } }),
		subFolder: undefined,
	},
	{
		path: "/posts/~server",
		type: PAGE_SERVER_ROUTE,
		endPoint: () => Promise.resolve({ default: pageServer }),
		subFolder: undefined,
	},
];

const template = `<html><head></head><body><div id="app">%COMPONENT_BODY%</div></body></html>`;

const load = createServerLoad(new Router().addPages(routes));

test("a flash set in an action shows on the redirected page and is then gone", async () => {
	// The action: POST ?/save sets a flash and redirects
	const post = new ServerEvent(
		new Request("http://localhost/posts?/save", {
			method: "POST",
			body: new FormData(),
		}),
	);
	const redirect = await load(post, template);
	expect(redirect.status).toBe(303);

	// Finalize like Server.fetch does: that is when cookies attach
	post.response = redirect;
	post.addHeaders();

	// In a real request the browser sends the flash cookie on the redirect;
	// constructing a fresh request with the cookie header simulates it
	const cookie = post
		.response!.headers.getSetCookie()
		.find((c) => c.startsWith("torpor-flash="))!
		.split(";")[0];
	const shown = await load(
		new ServerEvent(new Request("http://localhost/posts", { headers: { Cookie: cookie } })),
		template,
	);
	expect(await shown.text()).toContain('<p class="flash">Project saved</p>');

	// A later request: the message is gone (the delete cookie rode along)
	const later = await load(new ServerEvent(new Request("http://localhost/posts")), template);
	expect(await later.text()).toContain(`<p>no flash</p>`);
});
