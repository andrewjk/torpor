import { promises as fs, readFileSync } from "node:fs";

async function run() {
	const indexFile = "./dist/index.mjs";
	let source = await fs.readFile(indexFile, "utf8");
	source = source
		.replace(/^export \{(.+)\};/gms, (_, capture) => {
			return (
				"\n" +
				capture
					.split(",")
					.filter((c: string) => c.includes(" as "))
					.map((c: string) => {
						const parts = c.split(" as ");
						return `let ${parts[1].trim()} = ${parts[0].trim()};`;
					})
					.join("\n") +
				"\n"
			);
		})
		// HACK: Why are these imported?
		.replaceAll(/^import \{.+} from ".\/(.+?).mjs";/gm, (_, capture) => {
			const importedFile = `./dist/${capture}.mjs`;
			let importedSource = readFileSync(importedFile, "utf8");
			return importedSource.replace(/^export \{(.+)\};/gm, "");
		})
		.replaceAll(/^import ".\/(.+?).mjs";/gm, "")
		.replaceAll(/^\/\/.+?$/gm, "")
		.replaceAll(/^\/\*.+?^\*\//gms, "")
		.replaceAll(/\n+/g, "\n");

	const destFile = "../../site/src/views/repl/view.txt";
	await fs.writeFile(destFile, source);
}

await run();
