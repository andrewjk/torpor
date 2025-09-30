import type SourceRange from "./SourceRange";

export default interface SourceMapping {
	//script: string;
	source: SourceRange;
	compiled: SourceRange;
}
