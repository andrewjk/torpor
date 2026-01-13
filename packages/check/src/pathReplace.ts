// TODO: Implement more logic from https://www.typescriptlang.org/docs/handbook/modules/reference.html#paths
export default function pathReplace(pattern: string, replacement: string, value: string): string {
	pattern = "^" + pattern.replaceAll("*", "(.+?)");
	replacement = replacement.replaceAll("*", "$1");

	const regex1 = new RegExp(pattern);
	return value.replace(regex1, replacement);
}
