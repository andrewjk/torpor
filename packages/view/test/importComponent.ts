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
	const built = await buildFiles2(componentPath, source);

	const destFile = built[suffix];
	if (!destFile) {
		throw new Error("Component file not found");
	}

	return (await import(destFile)).default;
}
