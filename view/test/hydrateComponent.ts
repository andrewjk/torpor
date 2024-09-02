import fs from "fs";
import path from "path";
import { expect } from "vitest";
import build from "../src/compile/build";
import buildServer from "../src/compile/buildServer";
import parse from "../src/compile/parse";
import type Component from "../src/compile/types/Component";
import hydrate from "../src/render/hydrate";

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

	const source = fs.readFileSync(componentPath).toString();
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	expect(parsed.template).not.toBeUndefined();

	if (debugPrint) {
		const built = build(component.name, parsed.template!);
		console.log("=== client");
		console.log(built.code);
		console.log("===");
	}

	const imports = parsed
		.template!.imports?.map((imp) => {
			let importPath = path.join(path.dirname(componentPath), imp.path);
			let importSource = fs.readFileSync(importPath).toString();
			let importParsed = parse(importSource);
			expect(importParsed.ok).toBe(true);
			expect(importParsed.template).not.toBeUndefined();
			if (debugPrint) {
				const importBuilt = build(imp.name, importParsed.template!);
				console.log("=== client");
				console.log(importBuilt.code);
				console.log("===");
			}
			const importServer = buildServer(imp.name, importParsed.template!);
			return importServer.code.replace("export default ", "");
		})
		.join("\n");

	const server = buildServer(component.name, parsed.template!);
	const code = `
const x = {
render: ($state) => {
${imports}
${server.code.replace("export default ", "").replace(/^import.+\n/g, "")}

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
	// TODO: Should probably have a script instead
	const folder = componentPath.replace("/components/", "/components/output/");
	if (!fs.existsSync(path.dirname(folder))) {
		fs.mkdirSync(path.dirname(folder));
	}
	fs.writeFileSync(folder.replace(".tera", "-server.ts"), server.code);
	//fs.writeFileSync(folder.replace(".tera", ".html"), html);
	const client = build(component.name, parsed.template!);
	fs.writeFileSync(folder.replace(".tera", "-client.ts"), client.code);

	container.innerHTML = html;
	document.body.appendChild(container);

	hydrate(container, component, state);
}
