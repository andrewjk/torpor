import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import {
	checkRouteSource,
	checkRoutes,
	expectedAnnotationPath,
	reportRouteIssues,
} from "../src/site/checkRoutes";
import Site from "../src/site/Site";
import type Route from "../src/types/Route";
import {
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
	SERVER_ROUTE,
} from "../src/types/RouteType";

let tmpRoot = "";

beforeAll(async () => {
	tmpRoot = await fs.mkdtemp(path.join(tmpdir(), "torpor-build-checkroutes-test-"));
});

afterAll(async () => {
	if (tmpRoot) await fs.rm(tmpRoot, { recursive: true, force: true });
});

function check(source: string, expected = "/posts/[id]", typeName = "PageServerEndPoint") {
	return checkRouteSource(source, "src/routes/posts/[id]/+page.server.ts", expected, typeName);
}

describe("checkRouteSource", () => {
	test("correct annotation produces no issues", () => {
		const source = `import { type PageServerEndPoint } from "@torpor/build";\n\nexport default {} satisfies PageServerEndPoint<"/posts/[id]">;\n`;
		expect(check(source)).toEqual([]);
	});

	test("wrong route path is an error", () => {
		const source = `export default {} satisfies PageServerEndPoint<"/posts/[slug]">;\n`;
		const issues = check(source);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toContain('"/posts/[slug]"');
		expect(issues[0].message).toContain('"/posts/[id]"');
		expect(issues[0].line).toBe(1);
	});

	test("annotation on a later line reports that line", () => {
		const source = `import { type PageServerEndPoint } from "@torpor/build";\n\nexport default {}\n\tsatisfies PageServerEndPoint<"/nope">;\n`;
		expect(check(source)[0].line).toBe(4);
	});

	test("`satisfies T as T` widens: one warning, no error, on a static route", () => {
		const source = `export default {} satisfies PageServerEndPoint as PageServerEndPoint;\n`;
		const issues = check(source, "/posts");
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("warning");
		expect(issues[0].message).toContain('satisfies PageServerEndPoint<"/posts">');
	});

	test("`satisfies T<wrong> as T` produces one error and one warning only", () => {
		const source = `export default {} satisfies PageServerEndPoint<"/wrong"> as PageServerEndPoint;\n`;
		const issues = check(source);
		expect(issues.filter((i) => i.severity === "error")).toHaveLength(1);
		expect(issues.filter((i) => i.severity === "warning")).toHaveLength(1);
	});

	test("`as T` cast alone widens and checks its path", () => {
		const source = `export default {} as PageServerEndPoint<"/wrong">;\n`;
		const issues = check(source);
		expect(issues.filter((i) => i.severity === "error")).toHaveLength(1);
		expect(issues.filter((i) => i.severity === "warning")).toHaveLength(1);
	});

	test("variable annotation widens", () => {
		const source = `const page: PageEndPoint = {};\nexport default page;\n`;
		const issues = check(source, "/posts", "PageEndPoint");
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("warning");
		expect(issues[0].message).toContain("variable annotation");
	});

	test("bare `satisfies T` on a param'd route suggests a path", () => {
		const source = `export default {} satisfies PageServerEndPoint;\n`;
		const issues = check(source);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("warning");
		expect(issues[0].message).toContain('satisfies PageServerEndPoint<"/posts/[id]">');
	});

	test("bare `satisfies T` on a static route is fine", () => {
		expect(check(`export default {} satisfies PageServerEndPoint;\n`, "/posts")).toEqual([]);
	});

	test("no annotation on a param'd route warns", () => {
		const source = `export default { load: async () => undefined };\n`;
		const issues = check(source);
		expect(issues).toHaveLength(1);
		expect(issues[0].severity).toBe("warning");
		expect(issues[0].line).toBe(1);
		expect(issues[0].message).toContain('PageServerEndPoint<"/posts/[id]">');
	});

	test("no annotation on a static route is fine", () => {
		expect(check(`export default {};\n`, "/posts")).toEqual([]);
	});

	test("extra type arguments after the route path are handled", () => {
		const source = `export default {} satisfies PageEndPoint<"/posts/[id]", PageData<typeof server>>;\n`;
		expect(check(source, "/posts/[id]", "PageEndPoint")).toEqual([]);
	});

	test("a non-string first type argument is not treated as a route", () => {
		const source = `export default {} satisfies PageEndPoint<Data>;\n`;
		expect(check(source, "/posts", "PageEndPoint")).toEqual([]);
	});
});

describe("expectedAnnotationPath", () => {
	function route(path: string, type: Route["type"]): Route {
		return { path, file: "x.ts", type };
	}

	test("page and server routes use their path as-is", () => {
		expect(expectedAnnotationPath(route("/posts/[id]", PAGE_ROUTE))).toBe("/posts/[id]");
		expect(expectedAnnotationPath(route("/api/posts/[id]", SERVER_ROUTE))).toBe("/api/posts/[id]");
	});

	test("page server routes strip /~server, normalizing the root", () => {
		expect(expectedAnnotationPath(route("/posts/[id]/~server", PAGE_SERVER_ROUTE))).toBe(
			"/posts/[id]",
		);
		expect(expectedAnnotationPath(route("/~server", PAGE_SERVER_ROUTE))).toBe("/");
	});

	test("layout routes strip their suffix", () => {
		expect(expectedAnnotationPath(route("/posts/_layout", LAYOUT_ROUTE))).toBe("/posts");
		expect(expectedAnnotationPath(route("/posts/_layout/~server", LAYOUT_SERVER_ROUTE))).toBe(
			"/posts",
		);
		expect(expectedAnnotationPath(route("/_layout/~server", LAYOUT_SERVER_ROUTE))).toBe("/");
	});

	test("hook routes strip their suffix", () => {
		expect(expectedAnnotationPath(route("/api/_hook/~server", HOOK_SERVER_ROUTE))).toBe("/api");
	});
});

describe("checkRoutes", () => {
	test("checks files against routes derived from their location", async () => {
		const root = path.join(tmpRoot, "site1");
		await fs.mkdir(path.join(root, "src/routes/posts/[id]"), { recursive: true });
		await fs.writeFile(
			path.join(root, "src/routes/posts/[id]/+page.server.ts"),
			'export default {} satisfies PageServerEndPoint<"/posts/[slug]">;\n',
		);
		await fs.writeFile(path.join(root, "src/routes/+page.ts"), "export default {};\n");

		const site = new Site();
		site.root = root;
		await site.addRouteFolder("src/routes");

		const issues = checkRoutes(site);
		expect(issues).toHaveLength(1);
		expect(issues[0].file).toBe(path.join("src/routes/posts/[id]", "+page.server.ts"));
		expect(issues[0].severity).toBe("error");
	});

	test("subFolders are included in the expected path", async () => {
		const root = path.join(tmpRoot, "site2");
		await fs.mkdir(path.join(root, "api/posts/[id]"), { recursive: true });
		await fs.writeFile(
			path.join(root, "api/posts/[id]/+page.server.ts"),
			'export default {} satisfies PageServerEndPoint<"/posts/[id]">;\n',
		);

		const site = new Site();
		site.root = root;
		await site.addRouteFolder("api", "api");

		const issues = checkRoutes(site);
		expect(issues).toHaveLength(1);
		expect(issues[0].message).toContain('"/api/posts/[id]"');
	});

	test("skips .js route files and files that don't exist", async () => {
		const root = path.join(tmpRoot, "site3");
		await fs.mkdir(path.join(root, "src/routes/posts/[id]"), { recursive: true });
		await fs.writeFile(path.join(root, "src/routes/posts/[id]/+page.js"), "export default {};\n");
		await fs.writeFile(
			path.join(root, "src/routes/posts/[id]/+page.server.ts"),
			"export default {} satisfies PageServerEndPoint;\n",
		);

		const site = new Site();
		site.root = root;
		await site.addRouteFolder("src/routes");

		// The bare `satisfies` warns on the param'd route; the .js page doesn't
		expect(checkRoutes(site)).toHaveLength(1);
	});

	test("the package's own route fixtures pass cleanly", async () => {
		const site = new Site();
		site.root = path.join(import.meta.dirname, "..");
		await site.addRouteFolder("test/routes");
		await site.addRouteFolder("test/api", "api");
		expect(checkRoutes(site)).toEqual([]);
	});
});

describe("reportRouteIssues", () => {
	test("returns the number of errors", () => {
		const errors = reportRouteIssues([
			{ file: "a.ts", line: 1, severity: "error", message: "boom" },
			{ file: "b.ts", line: 2, severity: "warning", message: "meh" },
			{ file: "c.ts", line: 3, severity: "error", message: "bang" },
		]);
		expect(errors).toBe(2);
	});
});
