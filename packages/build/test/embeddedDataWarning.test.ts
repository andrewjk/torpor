import { afterEach, expect, test, vi } from "vite-plus/test";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type ServerLoadEvent from "../src/types/ServerLoadEvent";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";

const component = () => ({ body: "", head: "" });

/** A page (with a component) and its `~server` route, running `load`. */
function pageRoutes(
	path: string,
	load: (ev: ServerLoadEvent) => Promise<Response>,
): ManifestRoute[] {
	return [
		{
			path,
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
		{
			path: `${path}/~server`,
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: { load } }),
			subFolder: undefined,
		},
	];
}

function render(path: string, dev: boolean, load: (ev: ServerLoadEvent) => Promise<Response>) {
	const handler = createServerLoad(new Router().addPages(pageRoutes(path, load)), "", [], dev);
	return handler(new ServerEvent(new Request(`http://localhost${path}`)), "%COMPONENT_BODY%");
}

afterEach(() => {
	vi.restoreAllMocks();
});

test("dev warns once when embedded server data has no Cache-Control", async () => {
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	const load = async () => Response.json({ x: 1 });

	await render("/nocache", true, load);
	await render("/nocache", true, load);

	expect(warn).toHaveBeenCalledTimes(1);
	expect(warn.mock.calls[0][0]).toContain("/nocache");
});

test("an explicit Cache-Control silences the reminder", async () => {
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

	await render("/cached", true, async (ev) => {
		ev.headers.set("Cache-Control", "public, max-age=60");
		return Response.json({ x: 1 });
	});

	expect(warn).not.toHaveBeenCalled();
});

test("no reminder outside dev", async () => {
	const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

	await render("/prod", false, async () => Response.json({ x: 1 }));

	expect(warn).not.toHaveBeenCalled();
});
