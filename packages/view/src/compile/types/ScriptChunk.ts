import type SourceRange from "./SourceRange";

export default interface ScriptChunk {
	script: string;
	range: SourceRange;
}
