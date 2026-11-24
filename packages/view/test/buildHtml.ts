import fs from "node:fs";
import path from "node:path";
import { transform } from "sucrase";
import { expect } from "vite-plus/test";
import build from "../src/compile/build";
import parse from "../src/compile/parse";
import type BuildResult from "../src/compile/types/BuildResult";
import formatAttributeText from "../src/render/formatAttributeText";
import formatRawText from "../src/render/formatText";
import buildServerAttribute from "../src/ssr/buildAttribute";
import buildServerClasses from "../src/ssr/buildClasses";
import buildServerStyles from "../src/ssr/buildStyles";
import formatServerText from "../src/ssr/formatText";

const debugPrint = false;

export default async function buildHtml(
	source: string,
	state?: any,
	componentPath?: string,
): Promise<string> {
	// HACK: we may be running this from the top level, or from within the view folder
	if (componentPath && !fs.existsSync(componentPath)) {
		componentPath = path.join("view", componentPath);
	}

	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);
	expect(parsed.template).not.toBeUndefined();

	// TODO: Should we extract imports in parse? I guess that depends on whether it's used outside
	// of testing, e.g. in the REPL
	let imports: { importPath: string; importServer: BuildResult }[] = [];
	if (componentPath) {
		for (let imp of source.matchAll(/^import\s+(.+?)\s+from\s+(?:'|")(.+\.torp)(?:'|");*$/gm)) {
			const importPath = path.join(path.dirname(componentPath), imp[2]);
			const importSource = fs.readFileSync(importPath, "utf8");
			const importParsed = parse(importSource);
			expect(importParsed.errors).toEqual([]);
			expect(importParsed.template).not.toBeUndefined();
			const importServer = build(importParsed.template!, { server: true });
			imports.push({ importPath, importServer });
		}
	}

	const template = parsed.template!;
	const server = build(template, { server: true });
	const componentName = template.components.find((t) => t.default)!.name;

	// The helpers are function parameters rather than references: the code is
	// evaluated with `eval`, and the bundler rewrites module imports (so the
	// original names aren't in scope inside the evaluated string). Passing the
	// real SSR escaping helpers means these tests exercise the same escaping
	// the server build does, end to end.
	let code = `(function (t_fmt, t_fmt_raw, t_attr, t_attr_if, t_class, t_style) {
const $watch = (obj: Record<PropertyKey, any>) => obj;
const $unwrap = (obj: Record<PropertyKey, any>) => obj;
const $run = (fn: Function) => null;
const $onmount = (fn: Function) => null;
${
	imports
		?.map((imp) =>
			imp.importServer.code.replace("export default ", "").replace(/^import.+\n/gm, ""),
		)
		.join("\n") || ""
}
${server.code.replace("export default ", "").replace(/^import.+\n/gm, "")}
return ${componentName};
})`;
	// Strip TypeScript
	code = transform(code, { transforms: ["typescript"] }).code;

	if (debugPrint) {
		console.log("=== server");
		console.log(server.code);
		console.log("===");
	}

	// eslint-disable-next-line no-eval
	const factory = eval(code) as (...helpers: any[]) => (props?: any) => Promise<{ body: string }>;
	const html = (
		await factory(
			formatServerText,
			formatRawText,
			formatAttributeText,
			buildServerAttribute,
			buildServerClasses,
			buildServerStyles,
		)(state)
	).body.replaceAll(/\s+/g, " ");
	if (debugPrint) {
		console.log("=== server html");
		console.log(html);
		console.log("===");
	}

	return html.trim();
}
