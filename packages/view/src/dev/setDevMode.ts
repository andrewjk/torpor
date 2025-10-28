import type Effect from "../types/Effect";
import type Region from "../types/Region";
import devContext from "./devContext";
import type DevBoundary from "./types/DevBoundary";

//import popDevBoundary from "./popDevBoundary";
//import pushDevBoundary from "./pushDevBoundary";

export default function setDevMode(): void {
	devContext.enabled = true;

	// Format devContext for passing to DevTools by stripping out nodes etc
	devContext.format = () => {
		return {
			boundaries: devContext.boundaries.map((b) => ({
				type: b.type,
				id: b.id,
				name: b.name,
				depth: b.depth,
				//details: b.details,
			})),
		};
	};

	devContext.getDetails = (id: string) => {
		const boundary = devContext.boundaries.find((b) => b.id === id);
		if (boundary) {
			switch (boundary.type) {
				case "run": {
					return String(boundary.target);
				}
				default: {
					// TODO:
					return "I'm a " + boundary.type;
				}
			}
		}
		return "??";
	};

	devContext.unmark = () => {
		const el = document.getElementById("t_dev_mark");
		if (el) {
			el.style.display = "none";
		}
	};

	devContext.mark = (id: string) => {
		const boundary = devContext.boundaries.find((b) => b.id === id);
		if (boundary && boundary.target?.startNode && boundary.target?.endNode) {
			let el = document.getElementById("t_dev_mark");
			if (!el) {
				el = document.createElement("div");
				el.id = "t_dev_mark";
				el.style.position = "absolute";
				document.body.append(el);
			}

			const range = document.createRange();
			range.setStartBefore(boundary.target.startNode);
			range.setEndAfter(boundary.target.endNode);
			const rect = range.getBoundingClientRect();

			el.style.display = "block";
			el.style.left = rect.left + "px";
			el.style.top = rect.top + "px";
			el.style.height = rect.height + "px";
			el.style.width = rect.width + "px";
			//el.style.border = "2px solid limegreen";
			el.style.borderRadius = "2px";
			el.style.boxShadow = "rgba(50, 205, 50, 0.5) 0px 0px 0px 3px";
		}
	};

	// TODO: make this more robust
	let oldDepths: number[] = [];

	devContext.onRegionPushed = (region: Region, toParent: boolean) => {
		oldDepths.push(devContext.depth);
		if (toParent) {
			// It's a new region; bump the depth etc
			const name = region.name || "Anon Region";
			const id = crypto.randomUUID();
			const newBoundary = {
				type: "region",
				id,
				name,
				depth: devContext.depth,
				target: region,
			} satisfies DevBoundary;
			if (devContext.index === -1) {
				devContext.boundaries.push(newBoundary);
			} else {
				devContext.boundaries.splice(devContext.index, 0, newBoundary);
				devContext.index++;
			}
			//pushDevBoundary("region", name);
			region.name = `${name} [${id}]`;

			devContext.depth++;

			sendMessage("REFRESH");
		} else if (region.name) {
			devContext.index = -1;

			// It's an old region; get and set its depth and position for adding children
			const match = region.name.match(/.+?\[(.+?)\]/);
			if (match !== null && match.length > 0) {
				let id = match[1];
				let index = devContext.boundaries.findIndex((b) => b.id === id);
				if (index !== -1) {
					const parentDepth = devContext.boundaries[index].depth;
					devContext.depth = parentDepth + 1;
					// The index needs to be after the last child of the parent
					devContext.index = index + 1;
					while (
						devContext.index < devContext.boundaries.length &&
						devContext.boundaries[devContext.index].depth > parentDepth
					) {
						devContext.index++;
					}
				}
			}
		}
	};

	devContext.onRegionPopped = () => {
		//popDevBoundary();
		devContext.depth = oldDepths.pop() ?? 0;
	};

	devContext.onRegionCleared = (region: Region) => {
		let nextRegion: Region | null = region;
		while (true) {
			let match = nextRegion.name!.match(/.+?\[(.+?)\]/);
			if (match !== null && match.length > 0) {
				const id = match[1];
				let i = devContext.boundaries.findIndex((b) => b.id === id);
				if (i !== -1) {
					let depth = devContext.boundaries[i].depth;
					let start = i;
					let end = devContext.boundaries.length;
					for (i++; i < devContext.boundaries.length; i++) {
						if (devContext.boundaries[i].depth <= depth) {
							end = i;
							break;
						}
					}
					devContext.boundaries.splice(start, end - start);
				}
			}
			nextRegion = nextRegion.nextRegion;
			if (nextRegion === null || nextRegion.depth <= region.depth) {
				break;
			}
		}

		sendMessage("REFRESH");
	};

	// Messages

	devContext.effectRun = (effect: Effect) => {
		sendMessage("running effect " + effect.name);
	};

	function sendMessage(message: string) {
		window.postMessage(
			{
				source: "t_dev_tools",
				message,
			},
			"*",
		);
	}
}
