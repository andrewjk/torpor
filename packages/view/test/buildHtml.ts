import fs from "node:fs";
import path from "node:path";
import { transform } from "sucrase";
import { expect } from "vitest";
import build from "../src/compile/build";
import parse from "../src/compile/parse";
import { type BuildResult } from "../src/compile/types/BuildResult";

const debugPrint = false;

export default function buildHtml(source: string, state?: any, componentPath?: string): string {
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
	let code = `
const $watch = (obj: Record<PropertyKey, any>) => obj;
const $unwrap = (obj: Record<PropertyKey, any>) => obj;
const $run = (fn: Function) => null;
const $mount = (fn: Function) => null;
const t_fmt = (value: any) => (value ?? "").toString();
const t_attr = (value: any) => (value ?? "").toString().replaceAll('"', "&quot;")
${
	imports
		?.map((imp) =>
			imp.importServer.code.replace("export default ", "").replace(/^import.+\n/gm, ""),
		)
		.join("\n") || ""
}
${server.code.replace("export default ", "").replace(/^import.+\n/gm, "")}
${template.components.find((t) => t.default)!.name};
`;
	// Strip TypeScript
	code = transform(code, { transforms: ["typescript"] }).code;

	if (debugPrint) {
		console.log("=== server");
		console.log(server.code);
		console.log("===");
	}

	const html = eval(code)(state).replaceAll(/\s+/g, " ");
	if (debugPrint) {
		console.log("=== server html");
		console.log(html);
		console.log("===");
	}

	return html.trim();
}
