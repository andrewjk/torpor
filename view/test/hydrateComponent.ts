// Hydrate needs to come from the same source as component compilation
import { hydrate } from "@tera/view";
import fs from "fs";
import path from "path";
import tsb from "ts-blank-space";
import { expect } from "vitest";
import build from "../src/compile/build";
import parse from "../src/compile/parse";
import BuildResult from "../src/compile/types/BuildResult";
import type Component from "../src/types/Component";

const debugPrint = false;

export default function hydrateComponent(
	container: HTMLElement,
	componentPath: string,
	component: Component,
	state?: any,
) {
	// HACK: we may be running this from the top level, or from within the view folder
	if (!fs.existsSync(componentPath)) {
		componentPath = path.join("view", componentPath);
	}

	const source = fs.readFileSync(componentPath, "utf8");
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	expect(parsed.template).not.toBeUndefined();

	let imports: { importPath: string; importClient: BuildResult; importServer: BuildResult }[] = [];
	for (let imp of source.matchAll(/^import\s+(.+?)\s+from\s+(?:'|")(.+\.tera)(?:'|");*$/gm)) {
		const importPath = path.join(path.dirname(componentPath), imp[2]);
		const importSource = fs.readFileSync(importPath, "utf8");
		const importParsed = parse(importSource);
		expect(importParsed.ok).toBe(true);
		expect(importParsed.template).not.toBeUndefined();
		const importClient = build(importParsed.template!);
		if (debugPrint) {
			console.log("=== import client");
			console.log(importClient.code);
			console.log("===");
		}
		const importServer = build(importParsed.template!, { server: true });
		imports.push({ importPath, importClient, importServer });
	}

	const client = build(parsed.template!);
	if (debugPrint) {
		console.log("=== client");
		console.log(client.code);
		console.log("===");
	}

	const server = build(parsed.template!, { server: true });
	const code = tsb(`
const $watch = (obj: Record<PropertyKey, any>) => obj;
const $unwrap = (obj: Record<PropertyKey, any>) => obj;
const $run = (fn: Function) => null;
const $mount = (fn: Function) => null;
const t_fmt = (text: string) => (text != null ? text : "");
${
	imports
		?.map((imp) =>
			imp.importServer.code.replace("export default ", "").replace(/^import.+\n/gm, ""),
		)
		.join("\n") || ""
}
${server.code.replace("export default ", "").replace(/^import.+\n/gm, "")}
${component.name};
`);

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

	container.innerHTML = html;
	document.body.appendChild(container);

	hydrate(container, component, state);
}
