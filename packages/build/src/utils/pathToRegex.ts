export default function pathToRegex(path: string): RegExp {
	const pattern =
		path
			.split("/")
			// Replace `[slug]` (and `[...splat]`) with named capture groups
			.map((p) => {
				return p.replace(/\[(\.\.\.)?([^/]+?)\]/, (_, splat, name) =>
					splat ? `(?<${name as string}>.+)` : `(?<${name as string}>[^\\/]+?)`,
				);
			})
			.join("\\/")
			// Replace globs with regex syntax
			.replaceAll("*", ".*") +
		// Ignore trailing slashes -- `/path` should be treated the same as `/path/`
		"/*";
	return new RegExp(`^${pattern}/*$`);
}
