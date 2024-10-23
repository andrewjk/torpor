import fg from "fast-glob";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { buildType } from "../src/compile";
import build from "../src/compile/build";
import parse from "../src/compile/parse";

async function run() {
	console.log("Building test output files");
	const files = await fg("**/*.tera", {
		absolute: true,
		cwd: path.resolve("./test"),
	});
	await Promise.all(files.sort().map((f) => buildOutputFiles(f)));
	console.log("Done\n");
}

async function buildOutputFiles(file: string) {
	//console.log(`Building files for ${file.substring(path.resolve("./test").length)}`);

	const name = path.basename(file, ".tera");
	const source = await fs.readFile(file, "utf8");
	const parsed = parse(source);
	if (parsed.ok && parsed.template) {
		let serverCode = build(parsed.template, { server: true }).code;
		let clientCode = build(parsed.template).code;
		let typesCode = buildType(name, parsed.template);
		await fs.writeFile(file.replace(".tera", ".d.ts"), typesCode);

		let outputFile = file.replace("/components/", "/components/output/");
		if (!existsSync(path.dirname(outputFile))) {
			await fs.mkdir(path.dirname(outputFile));
		}
		await fs.writeFile(outputFile.replace(".tera", "-server.ts"), serverCode);
		await fs.writeFile(outputFile.replace(".tera", "-client.ts"), clientCode);
	} else {
		// Just log the message and continue with output/testing
		console.log("Parse failed for " + file);
	}
}

run();
