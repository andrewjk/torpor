import { devContext } from "../dev";

export default function pushDevBoundary(
	type: "component" | "region" | "run" | "watch" | "control" | "branch",
	name: string,
	target?: any,
): void {
	const newBoundary = {
		type,
		id: crypto.randomUUID(),
		name,
		depth: devContext.depth,
		target,
	};
	if (devContext.index === -1) {
		devContext.boundaries.push(newBoundary);
	} else {
		devContext.boundaries.splice(devContext.index, 0, newBoundary);
		devContext.index++;
	}
	devContext.depth++;
}
