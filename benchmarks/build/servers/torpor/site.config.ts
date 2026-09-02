import { node } from "@torpor/adapter-node";
import { Site, type ServerEndPoint } from "@torpor/build";
import { ok, response } from "@torpor/build/response";

// Endpoints-only site with the same route contract as the express / hono /
// fastify / elysia fixtures in the parent folder. Uses inline endpoints so
// the benchmark measures pure request handling (no file loading).

const site = new Site();
site.adapter = node;

site.addRoute("/", {
	server: {
		get: async () => ok("Hi"),
	} satisfies ServerEndPoint,
});
site.addRoute("/id/[id]", {
	server: {
		get: async ({ params, query, headers }) => {
			headers.set("x-powered-by", "benchmark");
			return ok(`${params.id} ${(await query()).name}`);
		},
	} satisfies ServerEndPoint,
});
site.addRoute("/user", {
	server: {
		get: async () => response(200, { id: 123, name: "Alice", roles: ["admin", "editor"] }),
	} satisfies ServerEndPoint,
});
site.addRoute("/json", {
	server: {
		post: async ({ json }) => response(200, await json()),
	} satisfies ServerEndPoint,
});

export default site;
