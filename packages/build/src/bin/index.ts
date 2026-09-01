#! /usr/bin/env node
import run, { loadSite } from "../run/run";
import runOpenApi from "../run/runOpenApi";

const workingDir = process.cwd();
if (process.argv.includes("--openapi")) {
	const flagIndex = process.argv.indexOf("--openapi");
	const next = process.argv[flagIndex + 1];
	const outFile = next && !next.startsWith("-") ? next : "openapi.json";
	const { site, vite } = await loadSite(workingDir);
	try {
		await runOpenApi(site, vite, outFile);
	} finally {
		await vite.close();
	}
} else if (process.argv.includes("--dev")) {
	await run(workingDir, "dev");
} else if (process.argv.includes("--build")) {
	await run(workingDir, "build");
} else if (process.argv.includes("--preview")) {
	await run(workingDir, "preview");
}
