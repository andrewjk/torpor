// Hydrate needs to come from the same source as component compilation
import { hydrate } from "@tera/view";
import fs from "fs";
import path from "path";
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
	const source = fs.readFileSync(componentPath).toString();
	const parsed = parse(name, source);
	expect(parsed.ok).toBe(true);
	expect(parsed.template).not.toBeUndefined();

	const imports = parsed.template!.imports?.map((imp) => {
		let importPath = path.join(path.dirname(componentPath), imp.path);
		let importSource = fs.readFileSync(importPath).toString();
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
	const code = `
const x = {
render: ($state) => {
${imports?.map((imp) => imp.importServer.code.replace("export default ", "")).join("\n") || ""}
${server.code.replace("export default ", "").replace(/^import.+\n/gm, "")}

return ${component.name}.render($state);
}
};

x;`;
	const html = eval(code).render(state).replaceAll(/\s+/g, " ");
	if (debugPrint) {
		console.log("=== server html");
		console.log(html);
		console.log("===");
	}

	// Write everything to files so we can keep an eye on regressions
	// TODO: Should probably have a script instead, that we run before commit
	const folder = componentPath.replace("/components/", "/components/output/");
	if (!fs.existsSync(path.dirname(folder))) {
		fs.mkdirSync(path.dirname(folder));
	}
	fs.writeFileSync(folder.replace(".tera", "-server.ts"), server.code);
	fs.writeFileSync(folder.replace(".tera", "-client.ts"), client.code);

	imports?.forEach((imp) => {
		const folder = imp.importPath.replace("/components/", "/components/output/");
		fs.writeFileSync(folder.replace(".tera", "-server.ts"), imp.importServer.code);
		fs.writeFileSync(folder.replace(".tera", "-client.ts"), imp.importClient.code);
	});

	container.innerHTML = html;
	document.body.appendChild(container);

	hydrate(container, component, state);
}
