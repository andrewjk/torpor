import type SourceSpan from "./SourceSpan";

export default interface SourceMapping {
	script: string;
	source: SourceSpan;
	compiled: SourceSpan;
}
