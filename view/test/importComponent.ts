import path from "path";
import { ExpectStatic } from "vitest";

export default async function importComponent(expect: ExpectStatic, relativePath: string) {
	let testPath = path.dirname(expect.getState().testPath!);
	let componentPath = path.join(testPath, relativePath);
	let Component = (await import(componentPath)).default;
	return { Component, componentPath };
}
