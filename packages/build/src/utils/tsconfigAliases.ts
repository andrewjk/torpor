import { readFileSync } from "node:fs";
import path from "node:path";

export interface AliasEntry {
	find: string | RegExp;
	replacement: string;
}

/**
 * Reads `tsconfig.json` `compilerOptions.paths` (relative to `baseUrl`,
 * defaulting to the tsconfig directory) and converts them to Vite
 * `resolve.alias` entries. Only handles paths declared in the root tsconfig
 * (not inherited via `extends`).
 */
export default function tsconfigAliases(root: string): AliasEntry[] {
	const file = path.join(root, "tsconfig.json");
	let paths: Record<string, string[]> | undefined;
	let baseUrl: string;
	try {
		const tsconfig = JSON.parse(stripJsonc(readFileSync(file, "utf-8")));
		const compilerOptions = tsconfig.compilerOptions ?? {};
		baseUrl = compilerOptions.baseUrl ? path.resolve(root, compilerOptions.baseUrl) : root;
		paths = compilerOptions.paths;
	} catch {
		return [];
	}
	if (!paths) return [];

	const aliases: AliasEntry[] = [];
	for (const [pattern, targets] of Object.entries(paths)) {
		const target = targets?.[0];
		if (!target) continue;
		if (pattern.endsWith("*")) {
			// `@/*` -> `./src/*`: match the literal prefix (`@/`) and rewrite to
			// the target dir. A string `find` is used (not a RegExp) because
			// Vite applies prefix-string aliases during SSR transform, which is
			// what makes path aliases resolve in the SSR module runner.
			const find = pattern.slice(0, -1);
			const targetDir = target.slice(0, -1);
			aliases.push({
				find,
				replacement: `${path.resolve(baseUrl, targetDir)}/`,
			});
		} else {
			aliases.push({ find: pattern, replacement: path.resolve(baseUrl, target) });
		}
	}
	return aliases;
}

/**
 * Strips JSONC comments and trailing commas so `tsconfig.json` (which permits
 * both) can be parsed with `JSON.parse`. String contents are preserved.
 */
export function stripJsonc(text: string): string {
	let out = "";
	for (let i = 0; i < text.length;) {
		const c = text[i];
		if (c === '"' || c === "'") {
			const quote = c;
			out += c;
			i++;
			while (i < text.length) {
				if (text[i] === "\\") {
					out += text[i] + (text[i + 1] ?? "");
					i += 2;
					continue;
				}
				const cc = text[i++];
				out += cc;
				if (cc === quote) break;
			}
			continue;
		}
		if (c === "/" && text[i + 1] === "/") {
			i += 2;
			while (i < text.length && text[i] !== "\n") i++;
			continue;
		}
		if (c === "/" && text[i + 1] === "*") {
			i += 2;
			while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
			i += 2;
			continue;
		}
		out += c;
		i++;
	}
	return out.replace(/,(\s*[}\]])/g, "$1");
}
