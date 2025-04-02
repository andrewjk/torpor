#! /usr/bin/env node
import run from "../site/run";

(async () => {
	const workingDir = process.cwd();
	if (process.argv.includes("--dev")) {
		await run(workingDir, "dev");
	} else if (process.argv.includes("--build")) {
		await run(workingDir, "build");
	} else if (process.argv.includes("--preview")) {
		await run(workingDir, "preview");
	}
})();
