import fs from "node:fs";
import path from "node:path";
import { buildFiles } from "./buildOutputFiles";

export default async function importComponent(componentPath: string, suffix: string): Promise<any> {
	if (!componentPath.endsWith(".torp")) componentPath += ".torp";
	await buildFiles(componentPath);

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
