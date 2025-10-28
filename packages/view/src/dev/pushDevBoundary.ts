import { devContext } from "../dev";

export default function pushDevBoundary(
	type: "component" | "region" | "run" | "watch" | "control" | "branch",
	name: string,
	target?: any,
): void {
	devContext.depth++;
	devContext.boundaries.push({
		type,
		id: crypto.randomUUID(),
		name,
		depth: devContext.depth,
		target,
	});
}
