import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import Site from "../src/site/Site";
import { checkLayoutSlot, checkLayoutSlots } from "../src/site/checkLayoutSlots";
import { LAYOUT_ROUTE, PAGE_ROUTE } from "../src/types/RouteType";

let tmpRoot = "";

beforeAll(() => {
	tmpRoot = path.join(tmpdir(), "torpor-layout-slot-test-");
	rmSync(tmpRoot, { recursive: true, force: true });
	mkdirSync(tmpRoot, { recursive: true });

	// tsconfig with an `@/*` path alias, for the alias-import test
	writeFileSync(
		path.join(tmpRoot, "tsconfig.json"),
		JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
	);

	writeFile("src/views/Good.torp", slotLayoutSource());
	writeFile("src/views/Broken.torp", layoutSource(false));
	writeFile("src/views/NamedOnly.torp", NAMED_ONLY_SOURCE);
	writeFile("src/views/Nested.torp", NESTED_SOURCE);
	writeFile("src/views/BrokenParse.torp", "export default function ( {");
});

afterAll(() => {
	if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
});

function writeFile(rel: string, content: string): void {
	const full = path.join(tmpRoot, rel);
	mkdirSync(path.dirname(full), { recursive: true });
	writeFileSync(full, content);
}

function layoutSource(withSlot: boolean): string {
	return `
export default function Layout() {
	@render {
		<main>
			<h1>Site</h1>
			${withSlot ? "<slot />" : "<!-- no slot here -->"}
		</main>
	}
}
`;
}

function slotLayoutSource(): string {
	return layoutSource(true);
}

// A layout that wraps its content in another component and passes the slot
// down -- the common shape the check must not flag
const NESTED_SOURCE = `
export default function NestedLayout() {
	@render {
		<Section>
			<slot />
		</Section>
	}
}

function Section() {
	@render {
		<section>
			<slot />
		</section>
	}
}
`;

const NAMED_ONLY_SOURCE = `
export default function NamedOnly() {
	@render {
		<main>
			<slot name="side" />
		</main>
	}
}
`;

function siteWithLayout(file: string): Site {
	const site = new Site();
	site.root = tmpRoot;
	site.addRoute("/", { layout: file, page: "src/views/Good.torp" });
	return site;
}

function layoutRoute(site: Site) {
	const route = site.routes.find((r) => r.type === LAYOUT_ROUTE);
	if (!route?.file) throw new Error("layout route not found");
	return route;
}

describe("checkLayoutSlots", () => {
	test("passes a layout that renders <slot />", () => {
		const site = siteWithLayout("src/views/Good.torp");
		expect(checkLayoutSlots(site)).toEqual([]);
	});

	test("flags a layout that never renders <slot />", () => {
		const site = siteWithLayout("src/views/Broken.torp");
		const issues = checkLayoutSlots(site);

		expect(issues.length).toBe(1);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].file).toBe("src/views/Broken.torp");
		expect(issues[0].message).toContain("never renders <slot />");
	});

	test("passes a layout that passes the slot down to a child component", () => {
		const site = siteWithLayout("src/views/Nested.torp");
		expect(checkLayoutSlots(site)).toEqual([]);
	});

	test("flags a layout that only renders a named slot", () => {
		const site = siteWithLayout("src/views/NamedOnly.torp");
		expect(checkLayoutSlots(site).length).toBe(1);
	});

	test("follows a .ts route file's default .torp import (relative)", () => {
		writeFile("src/routes/layout.ts", 'import component from "../views/Broken.torp";');
		const site = siteWithLayout("src/routes/layout.ts");

		const issues = checkLayoutSlots(site);
		expect(issues.length).toBe(1);
		// The issue names the ROUTE file, not the imported component
		expect(issues[0].file).toBe("src/routes/layout.ts");
	});

	test("follows a .ts route file's default .torp import (alias)", () => {
		writeFile("src/routes/layout-alias.ts", 'import component from "@/views/Broken.torp";');
		const site = siteWithLayout("src/routes/layout-alias.ts");

		expect(checkLayoutSlots(site).length).toBe(1);
	});

	test("skips a .ts route file that does not import a .torp component", () => {
		writeFile(
			"src/routes/no-torp.ts",
			"export default { component: () => {} } satisfies Record<string, unknown>;",
		);
		const site = siteWithLayout("src/routes/no-torp.ts");

		expect(checkLayoutSlots(site)).toEqual([]);
	});

	test("skips a .torp file with parse errors", () => {
		const site = siteWithLayout("src/views/BrokenParse.torp");
		expect(checkLayoutSlots(site)).toEqual([]);
	});

	test("ignores non-layout routes", () => {
		const site = new Site();
		site.root = tmpRoot;
		site.addRoute("/", { page: "src/views/Broken.torp" });

		expect(checkLayoutSlots(site)).toEqual([]);
		// Sanity: the page route really is a non-layout
		expect(site.routes[0].type).toBe(PAGE_ROUTE);
	});

	test("checkLayoutSlot handles a single route", () => {
		const site = siteWithLayout("src/views/Broken.torp");
		expect(checkLayoutSlot(site, layoutRoute(site)).length).toBe(1);
	});
});
