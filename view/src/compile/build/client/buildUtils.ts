import type BuildStatus from "./BuildStatus";

export function nextVarName(name: string, status: BuildStatus): string {
	if (!status.varNames[name]) {
		status.varNames[name] = 1;
	}
	let varName = `t_${name}_${status.varNames[name]}`;
	status.varNames[name] += 1;
	return varName;
}

export function isReactive(content: string) {
	// TODO: Need to be more fancy (check that braces match, ignore comments and strings etc)
	return content.includes("{") && content.includes("}");
}

export function isFullyReactive(content: string) {
	// TODO: Need to be more fancy (check that braces match, ignore comments and strings etc)
	return content.trim().startsWith("{") && content.trim().endsWith("}");
}

export function isReactiveAttribute(name: string, value: string) {
	// HACK: Better checking of whether an attribute is reactive
	return (
		(name.startsWith("{") && name.endsWith("}")) ||
		(value.startsWith("{") && value.endsWith("}")) ||
		name.startsWith("on")
	);
}
