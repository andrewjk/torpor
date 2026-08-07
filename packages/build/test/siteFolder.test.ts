import path from "node:path";
import { expect, test } from "vite-plus/test";
import Site from "../src/site/Site";

const root = path.join(import.meta.dirname, "..");

test("site routes", async () => {
	let site = new Site();
	site.root = root;
	await site.addRouteFolder("./test/routes");
	expect(site.routes.map((r) => r.path).join("\n")).toBe(
		`
/
/_error
/_hook/~server
/_layout
/_layout/~server
/~server
/posts
/posts/[id]
`.trim(),
	);
});

test("site routes with base folder", async () => {
	let site = new Site();
	site.root = root;
	await site.addRouteFolder("./test/routes");
	await site.addRouteFolder("./test/api", "api");
	expect(site.routes.map((r) => r.path).join("\n")).toBe(
		`
/
/_error
/_hook/~server
/_layout
/_layout/~server
/~server
/api/_hook/~server
/api/posts/~server
/api/posts/[id]/~server
/posts
/posts/[id]
`.trim(),
	);
});
