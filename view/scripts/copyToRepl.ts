import fg from "fast-glob";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { buildType } from "../src/compile";
import build from "../src/compile/build";
import parse from "../src/compile/parse";

async function run() {
	const indexFile = "./dist/index.js";
	const destFile = "../site/src/components/repl/view.txt";

	let source = await fs.readFile(indexFile, "utf8");
	let match = source.match(/export \{(.+?)\};/);

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
		.replace(
			/^import \{\s+formatText\s+\} from ".+?";/gms,
			`// src/render/formatText.ts
function formatText(text) {
  return text != null ? text : "";
}`,
		);

	await fs.writeFile(destFile, source);
}

run();
