import fs from "node:fs";
import path from "node:path";
import { buildFiles2 } from "./buildOutputFiles";

export default async function importComponent(
	testFile: string,
	source: string,
	suffix: string,
): Promise<any> {
	let componentName = path
		.basename(testFile)
		.replace(".test.ts", ".torp")
		.split("-")
		.map((b) => b.substring(0, 1).toUpperCase() + b.substring(1))
		.filter((b) => /[A-Za-z]+/.test(b))
		.join("");
	//const start = component.indexOf("function") + "function".length;
	//const end = component.indexOf("(");
	//let componentName = component.substring(start, end).trim();

	let componentPath = path.join(path.dirname(testFile), "components", componentName);
	await buildFiles2(componentPath, source);

	const destFolder = path.join(path.dirname(componentPath), "temp");
	let destFile = fs
		.readdirSync(destFolder)
		.find((f) => f.startsWith(`${path.basename(componentPath, ".torp")}-${suffix}-`));
	if (!destFile) {
		throw new Error("Component file not found");
	}
	destFile = path.join(destFolder, destFile);

	return (await import(destFile)).default;
}
