import Region from "../types/Region";
import devContext from "./devContext";

//import popDevBoundary from "./popDevBoundary";
//import pushDevBoundary from "./pushDevBoundary";

export default function setDevMode(): void {
	devContext.enabled = true;

	// TODO: make this more robust
	let oldDepth = 0;

	devContext.onRegionPushed = (region: Region, toParent: boolean, parentName?: string) => {
		oldDepth = devContext.depth;
		if (toParent) {
			devContext.depth++;
		} else if (parentName) {
			// Get the parent's depth
			//console.log("SEARCHING FOR NAME", parentName);
			let match = parentName.match(/.+?\[(.+?)\]/);
			if (match !== null && match.length > 0) {
				const id = match[1];
				//console.log("SEARCHING FOR ID", id);
				const parent = devContext.boundaries.find((b) => b.id === id);
				if (parent) {
					//console.log("SEARCHING FOR", JSON.stringify(parent, null, 2));
					devContext.depth = parent.depth + 1;
				}
			}
			// TODO: insert at the right position -- maybe store the boundaries tail
		}

		const name = region.name || "Anon Region";
		const id = crypto.randomUUID();
		devContext.boundaries.push({
			type: "region",
			id,
			name,
			depth: devContext.depth,
			target: region,
		});
		//pushDevBoundary("region", name);
		region.name = `${name} [${id}]`;
	};

	devContext.onRegionPopped = () => {
		//popDevBoundary();
		devContext.depth = oldDepth;
	};

	devContext.onRegionCleared = (region: Region) => {
		let nextRegion: Region | null = region;
		while (true) {
			let match = nextRegion.name!.match(/.+?\[(.+?)\]/);
			if (match !== null && match.length > 0) {
				const id = match[1];
				let i = devContext.boundaries.findIndex((b) => b.id === id);
				if (i !== -1) {
					let start = i;
					let end = devContext.boundaries.length;
					for (i++; i < devContext.boundaries.length; i++) {
						if (devContext.boundaries[i].depth <= nextRegion.depth) {
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
	};
}
