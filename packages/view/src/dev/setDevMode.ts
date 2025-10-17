import Range from "../types/Range";
import devContext from "./devContext";

export default function setDevMode(): void {
	devContext.enabled = true;

	devContext.onRangePushed = (range: Range) => {
		if (!range.name?.startsWith("R: ")) {
			range.name = `R: ${range.name} [${crypto.randomUUID()}]`;
			devContext.boundaries.push(range.name);
		}
	};

	devContext.onRangeCleared = (range: Range) => {
		let nextRange: Range | null = range;
		while (true) {
			//const name = `RANGE: ${nextRange.name}`;
			//console.log("CLEARING", nextRange.name);
			let i = devContext.boundaries.indexOf(nextRange.name!);
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
			nextRange = nextRange.nextRange;
			if (nextRange === null || nextRange.depth <= range.depth) {
				break;
			}
		}
	};
}
