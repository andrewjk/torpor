import type SourceRange from "../../types/SourceRange";

export default function emptyRange(): SourceRange {
	return {
		startIndex: 0,
		startLine: 0,
		startChar: 0,
		endIndex: 0,
		endLine: 0,
		endChar: 0,
	};
}
