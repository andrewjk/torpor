export default function pathToRegex(path: string): RegExp {
	const pattern =
		path
			.split("/")
			// Replace `[slug]` with a grouped match so we can pull out params
			.map((p) => {
				return p.replace(/\[([^/]+?)\]/, "(?<$1>[^\\/]+?)");
			})
			.join("\\/")
			// Replace globs with regex syntax
			.replaceAll("*", ".*") +
		// Ignore trailing slashes -- `/path` should be treated the same as `/path/`
		"/*";
	return new RegExp(`^${pattern}/*$`);
}
