import type SourceSpan from "./SourceSpan";

export default interface ScriptChunk {
	script: string;
	span: SourceSpan;
}
