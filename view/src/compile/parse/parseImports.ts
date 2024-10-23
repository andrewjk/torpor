import trimQuotes from "../utils/trimQuotes";
import trimStartAndEnd from "../utils/trimStartAndEnd";
import type ParseStatus from "./ParseStatus";

export default function parseImports(status: ParseStatus) {
	let start = 0;
	let level = 0;
	for (let i = 0; i < status.source.length + 1; i++) {
		// HACK: Really need to properly parse imports
		if (status.source[i] === "{") {
			level += 1;
		} else if (status.source[i] === "}") {
			level -= 1;
		}
		if ((status.source[i] === "\n" && level === 0) || status.source[i] === undefined) {
			const line = status.source.substring(start, i).trim();
			if (line.length) {
				if (line.startsWith("//")) {
					// Ignore commented imports
				} else if (line.startsWith("import ")) {
					// TODO: More import wrangling
					// (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
					status.imports ||= [];
					const importRegex = /import\s+(.+?)\s+from\s+([^;\n]+)/gms;
					const componentRegex = /\.tera$/gm;
					const importMatches = line.matchAll(importRegex);
					for (let match of importMatches) {
						const importName = match[1];
						const path = trimQuotes(match[2]);
						const component = componentRegex.test(path);
						let nonDefault = false;
						for (let name of importName.split(/\s*,\s*/)) {
							if (name.startsWith("{")) {
								nonDefault = true;
							}
							const nameParts = name.split(/\bas\b/);
							let newImport = {
								name: nameParts[0].trim(),
								alias: nameParts[1]?.trim(),
								path,
								nonDefault,
								component,
							};
							if (newImport.name) {
								newImport.name = trimStartAndEnd(newImport.name, "{", "}").trim();
							}
							if (newImport.alias) {
								newImport.alias = trimStartAndEnd(newImport.alias, "{", "}").trim();
							}
							status.imports.push(newImport);
							if (name.endsWith("}")) {
								nonDefault = false;
							}
						}
					}
					status.i = i;
				} else {
					// Imports are done!
					// TODO: Make sure there aren't any more with a regex
					break;
				}
			}
			start = i + 1;
		}
	}
}
