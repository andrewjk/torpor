export default function getClasses(value: unknown): string {
	let classes: string[] = [];
	gatherNames("", value, classes);
	return classes.join(" ");
}

function gatherNames(name: unknown, value: unknown, classes: string[]) {
	if (value) {
		if (Array.isArray(value)) {
			for (let v of value) {
				gatherNames(v, v, classes);
			}
		} else if (typeof value === "object") {
			for (let [n, v] of Object.entries(value)) {
				gatherNames(n, v, classes);
			}
		} else {
			classes.push(name as string);
		}
	}
}
