// Copied from @torpor/view because I can't get the types out of there...
export default interface SourceMap {
	script: string;
	source: { start: number; end: number };
	compiled: { start: number; end: number };
}
