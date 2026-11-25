import { expect, test } from "vite-plus/test";
import clientPreloads from "../src/run/clientPreloads";

const manifest = {
	"../node_modules/@torpor/build/dist/site/clientEntry.js": {
		file: "assets/clientEntry-AAAAAAAA.js",
		name: "clientEntry",
		src: "../node_modules/@torpor/build/dist/site/clientEntry.js",
		isEntry: true,
		imports: ["_runtime-BBBBBBBB.js"],
	},
	"_runtime-BBBBBBBB.js": { file: "assets/runtime-BBBBBBBB.js" },
	"_shared-CCCCCCCC.js": { file: "assets/shared-CCCCCCCC.js", imports: ["_runtime-BBBBBBBB.js"] },
	"src/routes/_layout.torp": {
		file: "assets/_layout-DDDDDDDD.js",
		src: "src/routes/_layout.torp",
		isEntry: true,
		imports: ["_shared-CCCCCCCC.js", "_runtime-BBBBBBBB.js"],
	},
	"src/routes/docs/+page.torp": {
		file: "assets/_page-EEEEEEEE.js",
		src: "src/routes/docs/+page.torp",
		isEntry: true,
		imports: ["_shared-CCCCCCCC.js"],
		dynamicImports: ["src/Repl.torp"],
	},
	"src/Repl.torp": { file: "assets/Repl-FFFFFFFF.js", src: "src/Repl.torp" },
};

const routes = [
	{ path: "/_layout", file: "/site/src/routes/_layout.torp" },
	{ path: "/docs", file: "/site/src/routes/docs/+page.torp" },
	{ path: "/missing", file: "/site/src/routes/missing/+page.torp" },
];

test("the client entry's chunks are listed once, for every page", () => {
	const preloads = clientPreloads(manifest, "/site", routes);
	expect(preloads.entry).toEqual([
		"/assets/clientEntry-AAAAAAAA.js",
		"/assets/runtime-BBBBBBBB.js",
	]);
});

test("each route lists its chunk and static imports, leaving out the entry's", () => {
	const preloads = clientPreloads(manifest, "/site", routes);
	expect(preloads.routes["/_layout"]).toEqual([
		"/assets/_layout-DDDDDDDD.js",
		"/assets/shared-CCCCCCCC.js",
	]);
	expect(preloads.routes["/docs"]).toEqual([
		"/assets/_page-EEEEEEEE.js",
		"/assets/shared-CCCCCCCC.js",
	]);
});

test("dynamic imports aren't preloaded, and unbuilt routes are skipped", () => {
	const preloads = clientPreloads(manifest, "/site", routes);
	expect(Object.values(preloads.routes).flat()).not.toContain("/assets/Repl-FFFFFFFF.js");
	expect(preloads.routes["/missing"]).toBeUndefined();
});
