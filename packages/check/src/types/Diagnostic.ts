export default interface Diagnostic {
	path: string;
	message: string;
	code?: number;
	range: {
		start: { line: number; character: number };
		end: { line: number; character: number };
	};
	lineText?: string;
}
