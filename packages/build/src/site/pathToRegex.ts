export default function pathToRegex(path: string): RegExp {
	const pattern = path
		.split("/")
		.map((p) => {
			return p.replace(/\[([^\/]+?)\]/, "(?<$1>[^\\/]+?)");
		})
		.join("\\/")
		.replaceAll("*", ".*");
	return new RegExp(`^${pattern}$`);
}
