import devContext from "../dev/devContext";
import DevBoundary from "./types/DevBoundary";

export default function pushDevBoundary(
	type: "component" | "region" | "run" | "watch" | "control" | "branch",
	name: string,
): DevBoundary {
	const newBoundary = {
		type,
		id: crypto.randomUUID(),
		name,
		depth: devContext.depth,
	};

	if (devContext.index === -1) {
		devContext.boundaries.push(newBoundary);
	} else {
		devContext.boundaries.splice(devContext.index, 0, newBoundary);
		devContext.index++;
	}

	devContext.depth++;

	return newBoundary;
}
