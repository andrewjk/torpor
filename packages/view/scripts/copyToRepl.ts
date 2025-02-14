import { promises as fs, readFileSync } from "node:fs";

async function run() {
	const indexFile = "./dist/index.js";
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
		.replaceAll(/^import \{.+} from ".\/chunk-(.+?).js";/gms, (_, capture) => {
			const chunkFile = `./dist/chunk-${capture}.js`;
			let chunkSource = readFileSync(chunkFile, "utf8");
			return chunkSource.replace(/^export \{(.+)\};/gms, "");
		})
		.replaceAll(/^import ".\/chunk-(.+?).js";/gms, "")
		.replaceAll(/\/\/# sourceMappingURL=(.+?).js.map/g, "");

	const destFile = "../../site/src/components/repl/view.txt";
	await fs.writeFile(destFile, source);
}

run();
