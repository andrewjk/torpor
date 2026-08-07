import { buildFiles } from "./buildOutputFiles";

export default async function importComponent(componentPath: string, suffix: string): Promise<any> {
	if (!componentPath.endsWith(".torp")) componentPath += ".torp";
	const built = await buildFiles(componentPath);

	const destFile = built[suffix];
	if (!destFile) {
		throw new Error("Component file not found");
	}

	return (await import(destFile)).default;
}
