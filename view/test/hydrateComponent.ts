// Hydrate needs to come from the same source as component compilation
import { hydrate } from "@tera/view";
import fs from "fs";
import path from "path";
import tsb from "ts-blank-space";
import { expect } from "vitest";
import build from "../src/compile/build";
import parse from "../src/compile/parse";
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

	const name = path.basename(componentPath, ".tera");
	const source = fs.readFileSync(componentPath, "utf8");
	const parsed = parse(name, source);
	expect(parsed.ok).toBe(true);
	expect(parsed.template).not.toBeUndefined();

	const imports = parsed.template!.imports?.map((imp) => {
		let importPath = path.join(path.dirname(componentPath), imp.path);
		let importSource = fs.readFileSync(importPath, "utf8");
		let importParsed = parse(imp.name, importSource);
		expect(importParsed.ok).toBe(true);
		expect(importParsed.template).not.toBeUndefined();
		const importClient = build(imp.name, importParsed.template!);
		if (debugPrint) {
			console.log("=== import client");
			console.log(importClient.code);
			console.log("===");
		}
		const importServer = build(imp.name, importParsed.template!, { server: true });
		return { importPath, importClient, importServer };
	});

	const client = build(component.name, parsed.template!);
	if (debugPrint) {
		console.log("=== client");
		console.log(client.code);
		console.log("===");
	}

	const server = build(component.name, parsed.template!, { server: true });
	const code = tsb(`
${
	imports
		?.map((imp) =>
			imp.importServer.code.replace("export default ", "").replaceAll("const $", "//const $"),
		)
		.join("\n") || ""
}
${server.code.replace("export default ", "").replace(/^import.+\n/gm, "")}
${component.name};
`);

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
