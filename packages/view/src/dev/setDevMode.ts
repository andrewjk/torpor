import Region from "../types/Region";
import devContext from "./devContext";

export default function setDevMode(): void {
	devContext.enabled = true;

	devContext.onRegionPushed = (region: Region) => {
		if (!region.name?.startsWith("R: ")) {
			region.name = `R: ${region.name} [${crypto.randomUUID()}]`;
			devContext.boundaries.push(region.name);
		}
	};

	devContext.onRegionCleared = (region: Region) => {
		let nextRegion: Region | null = region;
		while (true) {
			//const name = `RANGE: ${nextRegion.name}`;
			//console.log("CLEARING", nextRegion.name);
			let i = devContext.boundaries.indexOf(nextRegion.name!);
			//if (i !== -1) {
			let start = i;
			let end = devContext.boundaries.length;
			for (i++; i < devContext.boundaries.length; i++) {
				if (devContext.boundaries[i].startsWith("R: ")) {
					end = i;
					break;
				}
			}
			/*const rem =*/ devContext.boundaries.splice(start, end - start);
			//console.log("SPLICING DEV", rem);
			//}
			nextRegion = nextRegion.nextRegion;
			if (nextRegion === null || nextRegion.depth <= region.depth) {
				break;
			}
		}
	};
}
