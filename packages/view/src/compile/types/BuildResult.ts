import type SourceMapping from "./SourceMapping";

export default interface BuildResult {
	code: string;
	styles: {
		style: string;
		hash: string;
	}[];
	map: SourceMapping[];
}
