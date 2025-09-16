import fg from "fast-glob";
import path from "node:path";
import { buildFiles } from "../test/buildOutputFiles";

async function run() {
	console.log("Building test output files");
	const files = await fg("**/*.torp", {
		absolute: true,
		cwd: path.resolve("./test"),
	});
	await Promise.all(files.sort().map((f) => buildFiles(f)));
	console.log("Done\n");
}

await run();
